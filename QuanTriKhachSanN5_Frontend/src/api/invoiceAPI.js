import axios from "axios";

// 1. Tạo instance Axios với cấu hình chuẩn
const API = axios.create({
    // Ní kiểm tra xem Backend là http hay https nha, thường là http://localhost:5070/api
    baseURL: "http://localhost:5070/api", 
});

// 2. Gắn interceptor để tự động chèn Token vào mỗi request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. Định nghĩa các hàm gọi API cho Hóa đơn
const invoiceAPI = {
    preview: (bookingId) => API.get(`/Invoices/preview/${bookingId}`),

    checkout: (bookingId) => API.post(`/Invoices/checkout/${bookingId}`),

    getAll: () => API.get('/Invoices'),
    cancel: (invoiceId) => API.post(`/Invoices/cancel/${invoiceId}`),
    getById: (invoiceId) => API.get(`/Invoices/${invoiceId}`),
    confirmPayment: (invoiceId) => API.post(`/Invoices/confirm-payment/${invoiceId}`),
    createMomoPayment: (bookingId) => API.post(`/Invoices/create-momo-payment/${bookingId}`),
};

// 4. Export duy nhất một lần
export default invoiceAPI;