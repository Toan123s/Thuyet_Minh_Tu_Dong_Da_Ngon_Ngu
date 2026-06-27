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

    // Tìm booth gần nhất — hỗ trợ 2 cách gọi:
    //   boothService.findNearest(eventId, lat, lng)        — useGeofence
    //   boothService.findNearest({ lat, lng, eventId })    — LocationPage
    findNearest: (eventIdOrObj, latitude, longitude, radius = 15) => {
        let eventId, lat, lng;
        if (typeof eventIdOrObj === 'object' && eventIdOrObj !== null) {
            // Gọi dạng object: { lat, lng, eventId }
            ({ eventId, lat, lng } = eventIdOrObj);
            latitude  = lat;
            longitude = lng;
        } else {
            eventId = eventIdOrObj;
        }
        return api.post('/booths/nearest', {
            eventId:   Number(eventId),
            latitude:  Number(latitude),
            longitude: Number(longitude),
            radius,
        });
    },
};

export default boothService;