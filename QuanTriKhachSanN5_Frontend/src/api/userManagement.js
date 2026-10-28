import axiosClient from './axios';

export const userManagementAPI = {
    getUsers: () => axiosClient.get('/UserManagement'),
    createUser: (data) => axiosClient.post('/UserManagement', data),
    updateUser: (id, data) => axiosClient.put(`/UserManagement/${id}`, data),
    toggleStatus: (id) => axiosClient.put(`/UserManagement/${id}/toggle-status`) 
};