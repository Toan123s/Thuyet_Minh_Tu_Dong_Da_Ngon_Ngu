import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import boothService from '../services/boothService';

/**
 * Hook chạy nền: watchPosition → tìm booth gần nhất → navigate tự động.
 * @param {string|null} eventId       - ID sự kiện lấy từ query string
 * @param {boolean}     isActiveRoute - chỉ bật GPS khi đang ở visitor route
 */
export function useGeofence(eventId, isActiveRoute = true) {
    const navigate = useNavigate();

    const [booths,  setBooths]  = useState([]);
    const [nearby,  setNearby]  = useState(null);  // booth đang ở trong vùng
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    // Ref giữ watchId để clearWatch khi unmount/tắt route
    const watchIdRef   = useRef(null);
    // Ref tránh navigate lặp khi đã đến booth rồi vẫn đứng trong vùng
    const lastNavRef   = useRef(null);
    // Ref giữ danh sách booth mới nhất để dùng trong watchPosition callback
    const boothsRef    = useRef([]);

    // ── Tải danh sách booth của event ──────────────────────────
    const fetchBooths = useCallback(async () => {
        if (!eventId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await boothService.getByEventId(eventId);
            const list = Array.isArray(data) ? data : [];
            setBooths(list);
            boothsRef.current = list;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchBooths();
    }, [fetchBooths]);

    // ── Bật/tắt GPS watchPosition theo isActiveRoute ───────────
    useEffect(() => {
        if (!isActiveRoute || !eventId || !navigator.geolocation) return;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: userLat, longitude: userLng } = pos.coords;
                const list = boothsRef.current;
                if (!list.length) return;

                // Tính khoảng cách tới từng booth
                let closest = null;
                let minDist = Infinity;

                for (const booth of list) {
                    const bLat = parseFloat(booth.latitude ?? booth.Latitude);
                    const bLng = parseFloat(booth.longitude ?? booth.Longitude);
                    const r    = parseFloat(booth.radius ?? booth.Radius) || 15;
                    if (isNaN(bLat) || isNaN(bLng)) continue;

                    const dist = haversine(userLat, userLng, bLat, bLng);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = { ...booth, dist, radius: r };
                    }
                }

                if (closest && closest.dist <= closest.radius) {
                    setNearby(closest);

                    // Điều hướng tự động nếu chưa navigate tới booth này
                    const targetUrl = `/booth/${closest.id}?event=${eventId}&auto=1`;
                    if (lastNavRef.current !== closest.id) {
                        lastNavRef.current = closest.id;
                        setTimeout(() => navigate(targetUrl), 800); // delay nhỏ để toast hiện trước
                    }
                } else {
                    setNearby(null);
                    lastNavRef.current = null;
                }
            },
            () => {}, // im lặng nếu user từ chối GPS
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [isActiveRoute, eventId, navigate]);

    return { booths, nearby, loading, error, refresh: fetchBooths };
}

// ── Haversine formula (metres) ──────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
    const R  = 6371000;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}