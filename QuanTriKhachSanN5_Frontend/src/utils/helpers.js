// Format tiền tệ VNĐ
export const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Format ngày tháng
export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
};

// Cắt chuỗi dài
export const truncateText = (str, len) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
};

// Tạo query string cho API
export const buildQueryString = (params) => {
    const query = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            query.append(key, params[key]);
        }
    }
    return query.toString();
};