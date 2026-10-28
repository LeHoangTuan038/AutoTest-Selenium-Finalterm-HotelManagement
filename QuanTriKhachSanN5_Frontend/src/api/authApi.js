import axiosClient from './axios';

export const authAPI = {
    // Hàm gọi API đăng nhập xuống Backend
    login: (credentials) => {
        // credentials sẽ chứa { email, password }
        return axiosClient.post('/Auth/login', credentials);
    },
    
    // THÊM HÀM ĐĂNG KÝ VÀO ĐÂY NÈ ĐỈNH 🚀
    register: (data) => {
        // data sẽ chứa { fullName, email, phoneNumber, password, confirmPassword, otp }
        return axiosClient.post('/Auth/register', data);
    },

    sendOtp: (data) => {
        return axiosClient.post('/Auth/send-otp', data);
    },

    forgotPassword: (email) => {
        return axiosClient.post('/Auth/forgot-password', { email });
    },

    resetPassword: (data) => {
        return axiosClient.post('/Auth/reset-password', data);
    },

    changePasswordSendOtp: () => {
        return axiosClient.post('/Auth/change-password-send-otp');
    },

    changePassword: (data) => {
        return axiosClient.post('/Auth/change-password', data);
    }
};