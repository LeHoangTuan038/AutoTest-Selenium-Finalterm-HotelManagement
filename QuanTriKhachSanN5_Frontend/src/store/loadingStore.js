import { create } from 'zustand';

export const useLoadingStore = create((set) => ({
    isLoading: false, // Mặc định ban đầu là không loading
    setLoading: (status) => set({ isLoading: status }), // Hàm để bật/tắt
}));