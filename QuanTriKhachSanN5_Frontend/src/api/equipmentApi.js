import axios from './axios';

const API_BASE = 'http://localhost:5070/api';

export const equipmentApi = {
  getAll: () => axios.get(`${API_BASE}/Equipments`),
  getById: (id) => axios.get(`${API_BASE}/Equipments/${id}`),
  create: (data) => axios.post(`${API_BASE}/Equipments`, data),
  update: (id, data) => axios.put(`${API_BASE}/Equipments/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE}/Equipments/${id}`)
};

export default equipmentApi;

