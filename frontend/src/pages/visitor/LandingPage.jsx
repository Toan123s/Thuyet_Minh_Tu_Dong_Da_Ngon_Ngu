import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import eventService from '../../services/eventService';
import eventScanService from '../../services/eventScanService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './LandingPage.css';  // 🔥 IMPORT CSS

const LandingPage = () => {
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('event') || '1'; // TODO: bỏ || '1' khi dùng QR thật
    
    const navigate = useNavigate();
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [error, setError] = useState(null);

    // Chặn ghi lượt quét 2 lần khi React StrictMode (dev mode) chạy
    // effect 2 lần liên tiếp cho cùng 1 eventId — không liên quan gì
    // đến logic nghiệp vụ, chỉ là rào chắn kỹ thuật.
    const scannedEventIdRef = useRef(null);

    const fetchEvent = useCallback(async () => {
        
        try {
            setLoading(true);
            setError(null);
            console.log('📡 Đang tải sự kiện ID:', eventId);
            
            const data = await eventService.getById(eventId);
            console.log('✅ Dữ liệu sự kiện:', data);
            
            if (!data || !data.id) {
                throw new Error('Dữ liệu sự kiện không hợp lệ!');
            }
            
            setEventData(data);
            setQrCodeUrl(data.qrCodeUrl || null);

            // Ghi nhận 1 lượt quét QR cho event này. Đặt ở đây (sau khi
            // chắc chắn event tồn tại hợp lệ) để không đếm nhầm các lần
            // gọi lỗi/event không tồn tại. Không await/chặn UI — chạy
            // nền, không ảnh hưởng tốc độ hiển thị trang cho khách.
            if (scannedEventIdRef.current !== eventId) {
                scannedEventIdRef.current = eventId;
                const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
                eventScanService.log(eventId, deviceType);
            }
        } catch (error) {
            console.error('❌ Lỗi tải sự kiện:', error);
            setError(error.response?.data?.message || error.message || 'Không thể tải thông tin sự kiện!');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    const handleStartTour = () => {
        if (eventId) {
            navigate(`/location?event=${eventId}`);
        }
    };

    const handleCopyURL = () => {
        const url = `http://localhost:5173/?event=${eventId}`;
        navigator.clipboard.writeText(url);
        alert('📋 Đã copy URL!');
    };

    // ===== LOADING =====
    if (loading) {
        return <LoadingSpinner size="lg" label="Đang tải sự kiện..." />;
    }

    // ===== ERROR =====
    if (error) {
        return (
            <div className="error-page">
                <div className="error-container">
                    <h2 className="error-title">❌ {error}</h2>
                    <p className="error-text">Vui lòng quét mã QR để tham quan.</p>
                    <div className="error-debug">
                        <p>URL: {window.location.href}</p>
                        <p>Event ID: {eventId || 'Không có'}</p>
                    </div>
                    <button className="btn-retry" onClick={() => window.location.reload()}>
                        🔄 Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // ===== NO DATA =====
    if (!eventData) {
        return (
            <div className="error-page">
                <div className="error-container">
                    <h2 className="error-title">❌ Không tìm thấy sự kiện!</h2>
                    <p className="error-text">Event ID: {eventId}</p>
                    <p className="error-text">Vui lòng kiểm tra lại mã QR.</p>
                </div>
            </div>
        );
    }

    // ===== SUCCESS =====
    const statusClass = eventData.status === 'Đang mở' ? 'active' : 
                        eventData.status === 'Sắp tới' ? 'upcoming' : 'ended';

    return (
        <div className="landing-page">
            <div className="landing-content">
                {eventData.logoUrl && (
                    <img 
                        src={eventData.logoUrl} 
                        alt={eventData.name} 
                        className="event-logo"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                )}
                
                <h1 className="event-title">{eventData.name}</h1>
                <p className="event-description">{eventData.description}</p>
                
                <div className="event-info-grid">
                    <p>📍 <strong>Địa điểm:</strong> {eventData.location}</p>
                    <p>📅 <strong>Ngày:</strong> {new Date(eventData.startDate).toLocaleDateString('vi-VN')} - {new Date(eventData.endDate).toLocaleDateString('vi-VN')}</p>
                    <p>🏷️ <strong>Trạng thái:</strong> 
                        <span className={`status-badge ${statusClass}`}>
                            {eventData.status || 'Đang mở'}
                        </span>
                    </p>
                    <p>🏪 <strong>Số booth:</strong> {eventData.totalBooths || 0}</p>
                </div>
                
                {qrCodeUrl && (
                    <div className="qr-section">
                        <h3 className="qr-section-title">📱 Quét QR để bắt đầu</h3>
                        <img 
                            src={`http://localhost:5069${qrCodeUrl}`}
                            alt="QR Code sự kiện" 
                            onError={(e) => {
                                console.error('❌ Lỗi tải QR Code');
                                e.target.style.display = 'none';
                            }}
                        />
                        <p className="qr-section-note">Hoặc nhấn nút bên dưới để bắt đầu</p>
                    </div>
                )}
                
                <button className="btn-start" onClick={handleStartTour}>
                    🚀 Bắt đầu tham quan
                </button>

                <div className="admin-tools">
                    <button className="btn-copy-url" onClick={handleCopyURL}>
                        📋 Copy URL test
                    </button>
                    <span className="admin-tools-note">*(Dành cho Admin test)</span>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;