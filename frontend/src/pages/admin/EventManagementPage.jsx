import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import eventService from '../../services/eventService';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './EventManagementPage.css';

const EventManagementPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const data = await eventService.getAll();
            // Backend trả { items, total, ... } hoặc array thẳng
            setEvents(Array.isArray(data) ? data : (data?.items || []));
        } catch (error) {
            console.error('Lỗi tải sự kiện:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleViewQR = async (event) => {
        try {
            if (!event.qrCodeUrl) {
                const result = await eventService.generateQR(event.id);
                event.qrCodeUrl = result.qrCodeUrl;
            }
            setSelectedEvent(event);
            setQrCodeUrl(event.qrCodeUrl);
            setShowQRModal(true);
        } catch (error) {
            console.error('Lỗi tải QR:', error);
            alert('❌ Lỗi tải QR Code!');
        }
    };

    const handleDownloadQR = () => {
        if (!qrCodeUrl) return;
        const link = document.createElement('a');
        link.href = `http://localhost:5069${qrCodeUrl}`;
        link.download = `qrcode_${selectedEvent.name}_${selectedEvent.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRegenerateQR = async () => {
        try {
            const result = await eventService.generateQR(selectedEvent.id);
            setQrCodeUrl(result.qrCodeUrl);
            await fetchEvents();
            alert('✅ Tạo lại QR Code thành công!');
        } catch (error) {
            console.error('Lỗi tạo lại QR:', error);
            alert('❌ Lỗi tạo lại QR Code!');
        }
    };

    return (
        <Layout>
            <div className="event-management">
                <h1>📋 Quản lý sự kiện</h1>

                {loading ? (
                    <LoadingSpinner size="lg" label="Đang tải danh sách..." />
                ) : events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                        <p>Chưa có sự kiện nào. Hãy tạo sự kiện đầu tiên!</p>
                    </div>
                ) : (
                    <table className="event-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên sự kiện</th>
                                <th>Địa điểm</th>
                                <th>Trạng thái</th>
                                <th>Booth</th>
                                <th>QR Code</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td>#{event.id}</td>
                                    <td>{event.name}</td>
                                    <td>{event.location}</td>
                                    <td>
                                        <span className={`status-badge status-${event.status === 'Đang mở' ? 'active' : event.status === 'Sắp tới' ? 'upcoming' : 'ended'}`}>
                                            {event.status || 'Đang mở'}
                                        </span>
                                    </td>
                                    <td>{event.totalBooths}</td>
                                    <td>
                                        {event.qrCodeUrl ? (
                                            <span className="qr-status-created">✅ Đã tạo</span>
                                        ) : (
                                            <span className="qr-status-missing">❌ Chưa tạo</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className="btn-view-qr" onClick={() => handleViewQR(event)}>
                                            📱 Xem QR
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* QR MODAL */}
                {showQRModal && selectedEvent && (
                    <div className="qr-modal-overlay" onClick={() => setShowQRModal(false)}>
                        <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
                            <h2>📱 QR Code</h2>
                            <h3 style={{ textAlign: 'center', marginTop: '-10px', color: '#666' }}>
                                {selectedEvent.name}
                            </h3>

                            <div className="qr-image-container">
                                <img
                                    src={`http://localhost:5069${qrCodeUrl}`}
                                    alt="QR Code"
                                    className="qr-image"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-qr.png';
                                        e.target.alt = 'QR Code không khả dụng';
                                    }}
                                />
                            </div>

                            <div className="qr-info">
                                <p><strong>🔗 URL:</strong></p>
                                <code>http://localhost:5173/?event={selectedEvent.id}</code>
                                <p><strong>📌 Event ID:</strong> {selectedEvent.id}</p>
                                <p><strong>📂 Tên:</strong> {selectedEvent.name}</p>
                            </div>

                            <div className="qr-actions">
                                <button className="btn-download" onClick={handleDownloadQR}>⬇️ Tải xuống</button>
                                <button className="btn-regenerate" onClick={handleRegenerateQR}>🔄 Tạo lại</button>
                                <button className="btn-close" onClick={() => setShowQRModal(false)}>❌ Đóng</button>
                            </div>

                            <div className="qr-usage">
                                <h4>📋 Hướng dẫn sử dụng:</h4>
                                <ol>
                                    <li>Tải QR Code về máy</li>
                                    <li>In ra giấy (kích thước 5x5 cm trở lên)</li>
                                    <li>Dán tại cổng/trạm check-in sự kiện</li>
                                    <li>Khách hàng quét bằng điện thoại</li>
                                    <li>Tự động vào trang thông tin sự kiện</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EventManagementPage;
