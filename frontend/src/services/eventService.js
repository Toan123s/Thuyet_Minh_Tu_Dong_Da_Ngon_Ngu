import api from './apiClient';

const eventService = {
    getAll: async (status = null) => {
        const params = status ? { status } : {};
        return api.get('/events', { params });
    },

    getById: async (id) => {
        if (!id) throw new Error('Event ID không hợp lệ!');
        return api.get(`/events/${id}`);
    },

    create: async (eventData) => {
        return api.post('/events', eventData);
    },

    update: async (id, eventData) => {
        if (!id) throw new Error('Event ID không hợp lệ!');
        return api.put(`/events/${id}`, eventData);
    },

    delete: async (id) => {
        if (!id) throw new Error('Event ID không hợp lệ!');
        return api.delete(`/events/${id}`);
    },

    generateQR: async (id) => {
        if (!id) throw new Error('Event ID không hợp lệ!');
        return api.post(`/events/${id}/generate-qr`);
    },

    // ✅ FIX: getQRCode trả về Blob — cần dùng responseType: 'blob'
    // Nhưng apiClient interceptor trả về response.data (Blob) → đúng
    getQRCode: async (id) => {
        if (!id) throw new Error('Event ID không hợp lệ!');
        return api.get(`/events/${id}/qrcode`, { responseType: 'blob' });
    },

    checkQRExists: async (id) => {
        if (!id) return false;
        try {
            const data = await eventService.getById(id);
            return !!(data && data.qrCodeUrl);
        } catch {
            return false;
        }
    }
};

export default eventService;
