import axiosClient from "./axios";

const vietqrAPI = {
    getVietQRByInvoiceId: (invoiceId) => axiosClient.get(`/VietQR/${invoiceId}`),
};

export default vietqrAPI;
