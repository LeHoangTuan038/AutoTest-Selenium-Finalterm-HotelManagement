import axiosClient from './axios';

export const roomApi = {
    // Lấy danh sách
    getRooms: () => {
        return axiosClient.get('/Rooms'); 
    },
    // Thêm phòng mới
    createRoom: (data) => {
        return axiosClient.post('/Rooms', data);
    },
    // Cập nhật phòng
    updateRoom: (id, data) => {
        return axiosClient.put(`/Rooms/${id}`, data);
    },
    // Xóa phòng
    deleteRoom: (id) => {
        return axiosClient.delete(`/Rooms/${id}`);
    }
};