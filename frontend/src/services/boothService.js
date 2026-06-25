import api from './apiClient';

const boothService = {
    // Admin: lấy tất cả booth (có filter)
    getAll: ({ eventId = '', categoryId = '', search = '', page = 1, pageSize = 20 } = {}) => {
        const params = new URLSearchParams();
        if (eventId)    params.set('eventId',    eventId);
        if (categoryId) params.set('categoryId', categoryId);
        if (search)     params.set('search',     search);
        params.set('page',     page);
        params.set('pageSize', pageSize);
        return api.get(`/booths?${params}`);
    },

    // Visitor/Vendor: lấy booth theo event
    getByEventId: (eventId) => {
        if (!eventId) throw new Error('Event ID không hợp lệ!');
        return api.get(`/booths/event/${eventId}`);
    },

    // Lấy chi tiết 1 booth
    getById: (id) => {
        if (!id) throw new Error('Booth ID không hợp lệ!');
        return api.get(`/booths/${id}`);
    },

    // Tạo booth mới
    create: (data) => api.post('/booths', data),

    // Cập nhật booth
    update: (id, data) => api.put(`/booths/${id}`, data),

    // Xóa booth
    delete: (id) => api.delete(`/booths/${id}`),

    // Tìm booth gần nhất
    findNearest: (eventId, latitude, longitude, radius = 15) =>
        api.post('/booths/nearest', { eventId, latitude, longitude, radius }),
};

export default boothService;
