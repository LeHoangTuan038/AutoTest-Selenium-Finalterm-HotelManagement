import axiosClient from "./axios";

const momoAPI = {
    getPaymentQRByInvoiceId: (invoiceId) => axiosClient.get(`/VietQR/${invoiceId}`),
};

export default momoAPI;

