import { useState, useEffect, useCallback } from 'react';
import boothService from '../services/boothService';

export function useGeofence(eventId) {
    const [booths, setBooths] = useState([]);
    const [nearestBooth, setNearestBooth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBooths = useCallback(async () => {
        if (!eventId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            console.log('📡 Đang tải booth cho event:', eventId);
            
            const data = await boothService.getByEventId(eventId);
            console.log('✅ Danh sách booth:', data);
            setBooths(data || []);
        } catch (error) {
            console.error('❌ Lỗi tải booth:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchBooths();
    }, [fetchBooths]);

    const findNearestBooth = useCallback(async (latitude, longitude) => {
        try {
            const data = await boothService.findNearest(eventId, latitude, longitude);
            setNearestBooth(data);
            return data;
        } catch (error) {
            console.error('❌ Lỗi tìm booth gần nhất:', error);
            return null;
        }
    }, [eventId]);

    return {
        booths,
        nearestBooth,
        loading,
        error,
        findNearestBooth,
        refresh: fetchBooths
    };
}