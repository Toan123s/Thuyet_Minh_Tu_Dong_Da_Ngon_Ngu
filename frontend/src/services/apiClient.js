import axios from 'axios';

const API_BASE_URL = 'http://localhost:5069/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - thêm token nếu có (đọc cả localStorage + sessionStorage)
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ FIX: Trả về response.data thay vì full axios response
// Toàn bộ pages/services đều dùng kết quả trực tiếp như data,
// không dùng .status / .headers của axios response object.
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const msg = error.response?.data?.message
            || error.response?.data
            || error.message;
        const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        err.status = error.response?.status;
        err.data   = error.response?.data;
        console.error('API Error:', err.message);
        return Promise.reject(err);
    }
);

export default apiClient;
