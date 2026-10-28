import { create } from 'zustand';

export const useAdminAuthStore = create((set) => ({
    // Khởi tạo: Ưu tiên lấy dữ liệu đã lưu ở trình duyệt 
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    permissions: JSON.parse(localStorage.getItem('permissions')) || [],

    // Action: Lưu thông tin sau khi đăng nhập thành công [cite: 723]
    setAuth: (token, user, permissions) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('permissions', JSON.stringify(permissions));
        set({ token, user, permissions });
    },

    // Action: Xóa sạch dữ liệu khi logout hoặc token hết hạn [cite: 1216, 1275]
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        set({ token: null, user: null, permissions: [] });
    }
}));