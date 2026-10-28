import axios from 'axios';
import { useLoadingStore } from '../store/loadingStore'; 
import { useAdminAuthStore } from '../store/adminAuthStore';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5070/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. REQUEST INTERCEPTOR: Chạy TRƯỚC KHI gửi request lên server
axiosClient.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        
        // Nếu có token thì tự động đính kèm vào Header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        
        useLoadingStore.getState().setLoading(true); 
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 2. RESPONSE INTERCEPTOR: Chạy SAU KHI nhận data từ server về
axiosClient.interceptors.response.use(
    (response) => {
        
        useLoadingStore.getState().setLoading(false); 
        return response;
    },
    (error) => {
       
        useLoadingStore.getState().setLoading(false); 

        // Xử lý lỗi tập trung
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                useAdminAuthStore.getState().clearAuth();
                window.location.href = '/login'; // Chuyển hướng về trang đăng nhập
            } else if (status === 403) {
                console.error("Bạn không có quyền thực hiện thao tác này!");
                // Có thể dùng antd message.error() ở đây
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;

