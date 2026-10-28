import axiosClient from './axios';

const BASE_URL = 'http://localhost:5070/api';

// ===================== POSTS API =====================
export const postsApi = {
  getAll: () => axiosClient.get('/Posts'),
  getById: (id) => axiosClient.get(`/Posts/${id}`),
  getByRoomType: (roomTypeId) => axiosClient.get(`/Posts/roomtype/${roomTypeId}`),
  getByCategory: (categoryId) => axiosClient.get(`/Posts/category/${categoryId}`),
  create: (dto) => axiosClient.post('/Posts', dto),
  update: (id, dto) => axiosClient.put(`/Posts/${id}`, dto),
  delete: (id) => axiosClient.delete(`/Posts/${id}`),
};

// ===================== ATTRACTIONS API =====================
export const attractionsApi = {
  getAll: () => axiosClient.get('/Attractions'),
  getById: (id) => axiosClient.get(`/Attractions/${id}`),
  create: (dto) => axiosClient.post('/Attractions', dto),
  update: (id, dto) => axiosClient.put(`/Attractions/${id}`, dto),
  delete: (id) => axiosClient.delete(`/Attractions/${id}`),
};

// ===================== CATEGORIES API =====================
export const categoriesApi = {
  getAll: () => axiosClient.get('/Categories'),
};

// ===================== ROOM TYPES API =====================
export const roomTypesApi = {
  getAll: () => axiosClient.get('/RoomTypes/public'),
};
