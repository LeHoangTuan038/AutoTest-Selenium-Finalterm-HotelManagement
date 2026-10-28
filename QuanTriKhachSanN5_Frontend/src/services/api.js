import axios from 'axios';

// Cấu hình base URL cho API backend
const API_BASE_URL = 'http://localhost:5070/api';

// Lưu ý: Backend đang chạy trên cổng 5070
// Nếu backend chạy trên cổng khác, hãy cập nhật URL này
// Nếu backend không hoạt động, ứng dụng sẽ tự động sử dụng dữ liệu mẫu
// Lỗi 500 có thể do backend chưa cấu hình đúng hoặc database chưa kết nối

// Tạo instance axios với cấu hình mặc định
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token vào headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý lỗi response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Room API
export const roomApi = {
  // Lấy danh sách phòng
  getRooms: () => api.get('/rooms'),
  
  // Lấy phòng theo ID
  getRoomById: (id) => api.get(`/rooms/${id}`),
  
  // Cập nhật trạng thái phòng
  updateRoomStatus: (id, status) => api.put(`/rooms/${id}/status`, status),
  
  // Lấy danh sách loại phòng
  getRoomTypes: () => api.get('/roomtypes'),
  
  // Tìm phòng trống theo yêu cầu
  searchAvailableRooms: (params) => api.post('/bookings/search-room', params),
  
  // Lấy phòng vật lý trống cho lễ tân
  getAvailablePhysicalRooms: (roomTypeId, checkIn, checkOut) => 
    api.get(`/bookings/available-physical-rooms?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}`)
};

// Booking API
export const bookingApi = {
  // Lấy danh sách booking
  getBookings: () => api.get('/bookings'),
  
  // Lấy booking theo ID
  getBookingById: (id) => api.get(`/bookings/${id}`),
  
  // Tạo booking mới
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  
  // Cập nhật booking
  updateBooking: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  
  // Hủy booking
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
  
  // Nhận phòng
  checkIn: (bookingId, roomId) => api.post(`/reception/checkin/${bookingId}`, roomId),
  
  // Trả phòng
  checkOut: (bookingId) => api.get(`/reception/checkout/${bookingId}`),
  
  // Tạo invoice
  generateInvoice: (bookingId) => api.post('/checkout/generate-invoice', { bookingId }),
  
  // Thanh toán
  processPayment: (paymentData) => api.post('/checkout/process-payment', paymentData)
};

// Service API
export const serviceApi = {
  // Lấy danh sách dịch vụ
  getServices: () => api.get('/services'),
  
  // Lấy dịch vụ theo ID
  getServiceById: (id) => api.get(`/services/${id}`),
  
  // Đặt dịch vụ
  orderService: (serviceData) => api.post('/reception/services', serviceData),
  
  // Báo hỏng đồ
  reportDamage: (damageData) => api.post('/reception/damages', damageData),
  
  // Lấy danh sách đơn dịch vụ
  getOrderServices: () => api.get('/orderservices'),
  
  // Cập nhật trạng thái đơn dịch vụ
  updateOrderStatus: (id, status) => api.put(`/orderservices/${id}/status`, { status }),
  
  // Hủy đơn dịch vụ
  cancelOrder: (id) => api.delete(`/orderservices/${id}`)
};

// User API
export const userApi = {
  // Lấy thông tin người dùng
  getCurrentUser: () => api.get('/users/current'),
  
  // Lấy danh sách người dùng
  getUsers: () => api.get('/users'),
  
  // Cập nhật người dùng
  updateUser: (id, userData) => api.put(`/users/${id}`, userData)
};

// Room Inventory API
export const roomInventoryApi = {
  // Lấy danh sách tiện nghi
  getAmenities: () => api.get('/roominventory/amenities'),
  
  // Lấy vật tư trong phòng
  getRoomInventory: (roomId) => api.get(`/roominventory/rooms/${roomId}/inventory`),
  
  // Cập nhật trạng thái phòng
  updateRoomStatus: (roomId, status) => api.put(`/roominventory/rooms/${roomId}/status`, status)
};

// Loss and Damage API
export const lossAndDamageApi = {
  // Lấy danh sách phạt
  getAll: () => api.get('/lossanddamages'),
  
  // Tạo báo cáo phạt
  create: (report) => api.post('/lossanddamages', report),
  
  // Cập nhật báo cáo phạt
  update: (id, report) => api.put(`/lossanddamages/${id}`, report),
  
  // Vô hiệu hóa báo cáo phạt
  disable: (id) => api.delete(`/lossanddamages/${id}`),
  
  // Kích hoạt lại báo cáo phạt
  enable: (id) => api.put(`/lossanddamages/enable/${id}`),
  
  // Cập nhật trạng thái phạt
  updateStatus: (id, status) => api.put(`/lossanddamages/status/${id}`, { status })
};

// Receptionist API (API mới cho các chức năng lễ tân)
export const receptionistApi = {
  // Lấy danh sách phòng theo trạng thái
  getRoomsByStatus: (status) => api.get(`/rooms?status=${status}`),
  
  // Lấy danh sách booking theo ngày
  getBookingsByDate: (date) => api.get(`/bookings?date=${date}`),
  
  // Cập nhật trạng thái phòng
  updateRoomStatus: (roomId, status) => api.put(`/rooms/${roomId}/status`, { status }),
  
  // Tạo booking mới
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  
  // Cập nhật booking
  updateBooking: (bookingId, bookingData) => api.put(`/bookings/${bookingId}`, bookingData),
  
  // Hủy booking
  cancelBooking: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),
  
  // Thêm dịch vụ cho booking
  addService: (bookingId, serviceData) => api.post(`/bookings/${bookingId}/services`, serviceData),
  
  // Thêm phạt cho booking
  addPenalty: (bookingId, penaltyData) => api.post(`/bookings/${bookingId}/penalties`, penaltyData),
  
  // Tính toán hóa đơn
  calculateBill: (bookingId) => api.get(`/bookings/${bookingId}/bill`),
  
  // Thanh toán hóa đơn
  payBill: (bookingId, paymentData) => api.post(`/bookings/${bookingId}/pay`, paymentData),
  
  // Lấy danh sách dịch vụ
  getServices: () => api.get('/services'),
  
  // Lấy danh sách phạt
  getPenalties: () => api.get('/penalties'),
  
  // Cập nhật thông tin khách hàng
  updateGuestInfo: (bookingId, guestInfo) => api.put(`/bookings/${bookingId}/guest`, guestInfo),
  
  // Ghi chú đặc biệt cho booking
  addNote: (bookingId, note) => api.post(`/bookings/${bookingId}/notes`, { note }),
  
  // Lấy lịch sử hoạt động của booking
  getActivityHistory: (bookingId) => api.get(`/bookings/${bookingId}/history`),
  
  // Kiểm tra phòng trống theo thời gian
  checkAvailability: (roomId, checkIn, checkOut) => 
    api.get(`/rooms/${roomId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`),
  
  // Gán phòng cho booking
  assignRoom: (bookingId, roomId) => api.put(`/bookings/${bookingId}/assign-room`, { roomId }),
  
  // Hủy gán phòng
  unassignRoom: (bookingId) => api.put(`/bookings/${bookingId}/unassign-room`),
  
  // Lấy danh sách phòng đang dọn
  getCleaningRooms: () => api.get('/rooms?status=cleaning'),
  
  // Lấy danh sách phòng bảo trì
  getMaintenanceRooms: () => api.get('/rooms?status=maintenance'),
  
  // Cập nhật phòng đã dọn xong
  markRoomClean: (roomId) => api.put(`/rooms/${roomId}/mark-clean`),
  
  // Cập nhật phòng đang bảo trì
  markRoomMaintenance: (roomId) => api.put(`/rooms/${roomId}/mark-maintenance`),
  
  // Cập nhật phòng đã sửa xong
  markRoomFixed: (roomId) => api.put(`/rooms/${roomId}/mark-fixed`),
  
  // Lấy thống kê ngày
  getDailyStats: (date) => api.get(`/stats/daily?date=${date}`),
  
  // Lấy thống kê theo khoảng thời gian
  getStatsByPeriod: (startDate, endDate) => 
    api.get(`/stats/period?startDate=${startDate}&endDate=${endDate}`),
  
  // Tìm kiếm booking
  searchBookings: (query) => api.get(`/bookings/search?q=${query}`),
  
  // Tìm kiếm phòng
  searchRooms: (query) => api.get(`/rooms/search?q=${query}`),
  
  // Lấy danh sách khách hàng thường xuyên
  getFrequentGuests: () => api.get('/guests/frequent'),
  
  // Lấy thông tin khách hàng
  getGuestInfo: (guestId) => api.get(`/guests/${guestId}`),
  
  // Cập nhật điểm thưởng khách hàng
  updateGuestPoints: (guestId, points) => api.put(`/guests/${guestId}/points`, { points }),
  
  // Lấy danh sách voucher
  getVouchers: () => api.get('/vouchers'),
  
  // Áp dụng voucher cho booking
  applyVoucher: (bookingId, voucherCode) => api.post(`/bookings/${bookingId}/voucher`, { voucherCode }),
  
  // Hủy voucher
  removeVoucher: (bookingId) => api.delete(`/bookings/${bookingId}/voucher`),
  
  // Lấy danh sách phòng theo loại
  getRoomsByType: (roomTypeId) => api.get(`/rooms?type=${roomTypeId}`),
  
  // Lấy danh sách loại phòng
  getRoomTypes: () => api.get('/roomtypes'),
  
  // Lấy chi tiết booking
  getBookingDetails: (bookingId) => api.get(`/bookings/${bookingId}/details`),
  
  // Lấy danh sách dịch vụ đã đặt
  getOrderedServices: (bookingId) => api.get(`/bookings/${bookingId}/services`),
  
  // Lấy danh sách phạt đã ghi nhận
  getRecordedPenalties: (bookingId) => api.get(`/bookings/${bookingId}/penalties`),
  
  // Cập nhật dịch vụ đã cung cấp
  markServiceDelivered: (serviceId) => api.put(`/services/${serviceId}/delivered`),
  
  // Cập nhật phạt đã xử lý
  markPenaltyHandled: (penaltyId) => api.put(`/penalties/${penaltyId}/handled`),
  
  // Lấy danh sách phòng theo tầng
  getRoomsByFloor: (floor) => api.get(`/rooms?floor=${floor}`),
  
  // Lấy danh sách phòng theo khu vực
  getRoomsByArea: (area) => api.get(`/rooms?area=${area}`),
  
  // Lấy danh sách phòng VIP
  getVIPRooms: () => api.get('/rooms?vip=true'),
  
  // Lấy danh sách phòng đang có khách
  getOccupiedRooms: () => api.get('/rooms?status=occupied'),
  
  // Lấy danh sách phòng trống
  getAvailableRooms: () => api.get('/rooms?status=available'),
  
  // Lấy danh sách phòng chờ check-in
  getPendingCheckInRooms: () => api.get('/rooms?status=pending-checkin'),
  
  // Lấy danh sách phòng chờ check-out
  getPendingCheckOutRooms: () => api.get('/rooms?status=pending-checkout'),
  
  // Lấy danh sách phòng đã dọn xong
  getCleanRooms: () => api.get('/rooms?status=clean'),
  
  // Lấy danh sách phòng đang chờ dọn
  getDirtyRooms: () => api.get('/rooms?status=dirty'),
  
  // Lấy danh sách phòng đang sửa chữa
  getRepairingRooms: () => api.get('/rooms?status=repairing'),
  
  // Lấy danh sách phòng đã sửa xong
  getFixedRooms: () => api.get('/rooms?status=fixed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra
  getInspectionRooms: () => api.get('/rooms?status=inspection'),
  
  // Lấy danh sách phòng đã kiểm tra xong
  getInspectedRooms: () => api.get('/rooms?status=inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao
  getHandoverRooms: () => api.get('/rooms?status=handover'),
  
  // Lấy danh sách phòng đã bàn giao
  getHandedOverRooms: () => api.get('/rooms?status=handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận
  getReceivingRooms: () => api.get('/rooms?status=receiving'),
  
  // Lấy danh sách phòng đã nhận
  getReceivedRooms: () => api.get('/rooms?status=received'),
  
  // Lấy danh sách phòng đang chờ dọn vệ sinh
  getCleaningRequestedRooms: () => api.get('/rooms?status=cleaning-requested'),
  
  // Lấy danh sách phòng đang được dọn vệ sinh
  getCleaningInProgressRooms: () => api.get('/rooms?status=cleaning-in-progress'),
  
  // Lấy danh sách phòng đã dọn vệ sinh xong
  getCleaningCompletedRooms: () => api.get('/rooms?status=cleaning-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra vệ sinh
  getCleaningInspectionRooms: () => api.get('/rooms?status=cleaning-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra vệ sinh xong
  getCleaningInspectedRooms: () => api.get('/rooms?status=cleaning-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao vệ sinh
  getCleaningHandoverRooms: () => api.get('/rooms?status=cleaning-handover'),
  
  // Lấy danh sách phòng đã bàn giao vệ sinh
  getCleaningHandedOverRooms: () => api.get('/rooms?status=cleaning-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận vệ sinh
  getCleaningReceivingRooms: () => api.get('/rooms?status=cleaning-receiving'),
  
  // Lấy danh sách phòng đã nhận vệ sinh
  getCleaningReceivedRooms: () => api.get('/rooms?status=cleaning-received'),
  
  // Lấy danh sách phòng đang chờ bảo trì
  getMaintenanceRequestedRooms: () => api.get('/rooms?status=maintenance-requested'),
  
  // Lấy danh sách phòng đang được bảo trì
  getMaintenanceInProgressRooms: () => api.get('/rooms?status=maintenance-in-progress'),
  
  // Lấy danh sách phòng đã bảo trì xong
  getMaintenanceCompletedRooms: () => api.get('/rooms?status=maintenance-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra bảo trì
  getMaintenanceInspectionRooms: () => api.get('/rooms?status=maintenance-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra bảo trì xong
  getMaintenanceInspectedRooms: () => api.get('/rooms?status=maintenance-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao bảo trì
  getMaintenanceHandoverRooms: () => api.get('/rooms?status=maintenance-handover'),
  
  // Lấy danh sách phòng đã bàn giao bảo trì
  getMaintenanceHandedOverRooms: () => api.get('/rooms?status=maintenance-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận bảo trì
  getMaintenanceReceivingRooms: () => api.get('/rooms?status=maintenance-receiving'),
  
  // Lấy danh sách phòng đã nhận bảo trì
  getMaintenanceReceivedRooms: () => api.get('/rooms?status=maintenance-received'),
  
  // Lấy danh sách phòng đang chờ dọn dẹp sau bảo trì
  getMaintenanceCleaningRooms: () => api.get('/rooms?status=maintenance-cleaning'),
  
  // Lấy danh sách phòng đang được dọn dẹp sau bảo trì
  getMaintenanceCleaningInProgressRooms: () => api.get('/rooms?status=maintenance-cleaning-in-progress'),
  
  // Lấy danh sách phòng đã dọn dẹp sau bảo trì xong
  getMaintenanceCleaningCompletedRooms: () => api.get('/rooms?status=maintenance-cleaning-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra dọn dẹp sau bảo trì
  getMaintenanceCleaningInspectionRooms: () => api.get('/rooms?status=maintenance-cleaning-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra dọn dẹp sau bảo trì xong
  getMaintenanceCleaningInspectedRooms: () => api.get('/rooms?status=maintenance-cleaning-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao dọn dẹp sau bảo trì
  getMaintenanceCleaningHandoverRooms: () => api.get('/rooms?status=maintenance-cleaning-handover'),
  
  // Lấy danh sách phòng đã bàn giao dọn dẹp sau bảo trì
  getMaintenanceCleaningHandedOverRooms: () => api.get('/rooms?status=maintenance-cleaning-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận dọn dẹp sau bảo trì
  getMaintenanceCleaningReceivingRooms: () => api.get('/rooms?status=maintenance-cleaning-receiving'),
  
  // Lấy danh sách phòng đã nhận dọn dẹp sau bảo trì
  getMaintenanceCleaningReceivedRooms: () => api.get('/rooms?status=maintenance-cleaning-received'),
  
  // Lấy danh sách phòng đang chờ kiểm tra cuối cùng
  getFinalInspectionRooms: () => api.get('/rooms?status=final-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra cuối cùng xong
  getFinalInspectedRooms: () => api.get('/rooms?status=final-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao cuối cùng
  getFinalHandoverRooms: () => api.get('/rooms?status=final-handover'),
  
  // Lấy danh sách phòng đã bàn giao cuối cùng
  getFinalHandedOverRooms: () => api.get('/rooms?status=final-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận cuối cùng
  getFinalReceivingRooms: () => api.get('/rooms?status=final-receiving'),
  
  // Lấy danh sách phòng đã nhận cuối cùng
  getFinalReceivedRooms: () => api.get('/rooms?status=final-received'),
  
  // Lấy danh sách phòng đang chờ check-in
  getCheckInRequestedRooms: () => api.get('/rooms?status=checkin-requested'),
  
  // Lấy danh sách phòng đang được check-in
  getCheckInProgressRooms: () => api.get('/rooms?status=checkin-in-progress'),
  
  // Lấy danh sách phòng đã check-in xong
  getCheckInCompletedRooms: () => api.get('/rooms?status=checkin-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra check-in
  getCheckInInspectionRooms: () => api.get('/rooms?status=checkin-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra check-in xong
  getCheckInInspectedRooms: () => api.get('/rooms?status=checkin-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao check-in
  getCheckInHandoverRooms: () => api.get('/rooms?status=checkin-handover'),
  
  // Lấy danh sách phòng đã bàn giao check-in
  getCheckInHandedOverRooms: () => api.get('/rooms?status=checkin-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận check-in
  getCheckInReceivingRooms: () => api.get('/rooms?status=checkin-receiving'),
  
  // Lấy danh sách phòng đã nhận check-in
  getCheckInReceivedRooms: () => api.get('/rooms?status=checkin-received'),
  
  // Lấy danh sách phòng đang chờ check-out
  getCheckOutRequestedRooms: () => api.get('/rooms?status=checkout-requested'),
  
  // Lấy danh sách phòng đang được check-out
  getCheckOutInProgressRooms: () => api.get('/rooms?status=checkout-in-progress'),
  
  // Lấy danh sách phòng đã check-out xong
  getCheckOutCompletedRooms: () => api.get('/rooms?status=checkout-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra check-out
  getCheckOutInspectionRooms: () => api.get('/rooms?status=checkout-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra check-out xong
  getCheckOutInspectedRooms: () => api.get('/rooms?status=checkout-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao check-out
  getCheckOutHandoverRooms: () => api.get('/rooms?status=checkout-handover'),
  
  // Lấy danh sách phòng đã bàn giao check-out
  getCheckOutHandedOverRooms: () => api.get('/rooms?status=checkout-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận check-out
  getCheckOutReceivingRooms: () => api.get('/rooms?status=checkout-receiving'),
  
  // Lấy danh sách phòng đã nhận check-out
  getCheckOutReceivedRooms: () => api.get('/rooms?status=checkout-received'),
  
  // Lấy danh sách phòng đang chờ dọn dẹp sau check-out
  getCheckOutCleaningRooms: () => api.get('/rooms?status=checkout-cleaning'),
  
  // Lấy danh sách phòng đang được dọn dẹp sau check-out
  getCheckOutCleaningInProgressRooms: () => api.get('/rooms?status=checkout-cleaning-in-progress'),
  
  // Lấy danh sách phòng đã dọn dẹp sau check-out xong
  getCheckOutCleaningCompletedRooms: () => api.get('/rooms?status=checkout-cleaning-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra dọn dẹp sau check-out
  getCheckOutCleaningInspectionRooms: () => api.get('/rooms?status=checkout-cleaning-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra dọn dẹp sau check-out xong
  getCheckOutCleaningInspectedRooms: () => api.get('/rooms?status=checkout-cleaning-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao dọn dẹp sau check-out
  getCheckOutCleaningHandoverRooms: () => api.get('/rooms?status=checkout-cleaning-handover'),
  
  // Lấy danh sách phòng đã bàn giao dọn dẹp sau check-out
  getCheckOutCleaningHandedOverRooms: () => api.get('/rooms?status=checkout-cleaning-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận dọn dẹp sau check-out
  getCheckOutCleaningReceivingRooms: () => api.get('/rooms?status=checkout-cleaning-receiving'),
  
  // Lấy danh sách phòng đã nhận dọn dẹp sau check-out
  getCheckOutCleaningReceivedRooms: () => api.get('/rooms?status=checkout-cleaning-received'),
  
  // Lấy danh sách phòng đang chờ kiểm tra cuối cùng sau check-out
  getCheckOutFinalInspectionRooms: () => api.get('/rooms?status=checkout-final-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra cuối cùng sau check-out xong
  getCheckOutFinalInspectedRooms: () => api.get('/rooms?status=checkout-final-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao cuối cùng sau check-out
  getCheckOutFinalHandoverRooms: () => api.get('/rooms?status=checkout-final-handover'),
  
  // Lấy danh sách phòng đã bàn giao cuối cùng sau check-out
  getCheckOutFinalHandedOverRooms: () => api.get('/rooms?status=checkout-final-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận cuối cùng sau check-out
  getCheckOutFinalReceivingRooms: () => api.get('/rooms?status=checkout-final-receiving'),
  
  // Lấy danh sách phòng đã nhận cuối cùng sau check-out
  getCheckOutFinalReceivedRooms: () => api.get('/rooms?status=checkout-final-received'),
  
  // Lấy danh sách phòng đang chờ dọn dẹp sau bảo trì và check-out
  getMaintenanceCheckOutCleaningRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning'),
  
  // Lấy danh sách phòng đang được dọn dẹp sau bảo trì và check-out
  getMaintenanceCheckOutCleaningInProgressRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning-in-progress'),
  
  // Lấy danh sách phòng đã dọn dẹp sau bảo trì và check-out xong
  getMaintenanceCheckOutCleaningCompletedRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra dọn dẹp sau bảo trì và check-out
  getMaintenanceCheckOutCleaningInspectionRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra dọn dẹp sau bảo trì và check-out xong
  getMaintenanceCheckOutCleaningInspectedRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao dọn dẹp sau bảo trì và check-out
  getMaintenanceCheckOutCleaningHandoverRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning-handover'),
  
  // Lấy danh sách phòng đã bàn giao dọn dẹp sau bảo trì và check-out
  getMaintenanceCheckOutCleaningHandedOverRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận dọn dẹp sau bảo trì và check-out
  getMaintenanceCheckOutCleaningReceivingRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning-receiving'),
  
  // Lấy danh sách phòng đã nhận dọn dẹp sau bảo trì và check-out
  getMaintenanceCheckOutCleaningReceivedRooms: () => api.get('/rooms?status=maintenance-checkout-cleaning-received'),
  
  // Lấy danh sách phòng đang chờ kiểm tra cuối cùng sau bảo trì và check-out
  getMaintenanceCheckOutFinalInspectionRooms: () => api.get('/rooms?status=maintenance-checkout-final-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra cuối cùng sau bảo trì và check-out xong
  getMaintenanceCheckOutFinalInspectedRooms: () => api.get('/rooms?status=maintenance-checkout-final-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao cuối cùng sau bảo trì và check-out
  getMaintenanceCheckOutFinalHandoverRooms: () => api.get('/rooms?status=maintenance-checkout-final-handover'),
  
  // Lấy danh sách phòng đã bàn giao cuối cùng sau bảo trì và check-out
  getMaintenanceCheckOutFinalHandedOverRooms: () => api.get('/rooms?status=maintenance-checkout-final-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận cuối cùng sau bảo trì và check-out
  getMaintenanceCheckOutFinalReceivingRooms: () => api.get('/rooms?status=maintenance-checkout-final-receiving'),
  
  // Lấy danh sách phòng đã nhận cuối cùng sau bảo trì và check-out
  getMaintenanceCheckOutFinalReceivedRooms: () => api.get('/rooms?status=maintenance-checkout-final-received'),
  
  // Lấy danh sách phòng đang chờ dọn dẹp sau check-in và check-out
  getCheckInCheckOutCleaningRooms: () => api.get('/rooms?status=checkin-checkout-cleaning'),
  
  // Lấy danh sách phòng đang được dọn dẹp sau check-in và check-out
  getCheckInCheckOutCleaningInProgressRooms: () => api.get('/rooms?status=checkin-checkout-cleaning-in-progress'),
  
  // Lấy danh sách phòng đã dọn dẹp sau check-in và check-out xong
  getCheckInCheckOutCleaningCompletedRooms: () => api.get('/rooms?status=checkin-checkout-cleaning-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra dọn dẹp sau check-in và check-out
  getCheckInCheckOutCleaningInspectionRooms: () => api.get('/rooms?status=checkin-checkout-cleaning-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra dọn dẹp sau check-in và check-out xong
  getCheckInCheckOutCleaningInspectedRooms: () => api.get('/rooms?status=checkin-checkout-cleaning-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao dọn dẹp sau check-in và check-out
  getCheckInCheckOutCleaningHandoverRooms: () => api.get('/rooms?status=checkin-checkout-cleaning-handover'),
  
  // Lấy danh sách phòng đã bàn giao dọn dẹp sau check-in và check-out
  getCheckInCheckOutCleaningHandedOverRooms: () => api.get('/rooms?status=checkin-checkout-cleaning-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận dọn dẹp sau check-in và check-out
  getCheckInCheckOutCleaningReceivingRooms: () => api.get('/rooms?status=checkin-checkout-cleaning-receiving'),
  
  // Lấy danh sách phòng đã nhận dọn dẹp sau check-in và check-out
  getCheckInCheckOutCleaningReceivedRooms: () => api.get('/rooms?status=checkin-checkout-cleaning-received'),
  
  // Lấy danh sách phòng đang chờ kiểm tra cuối cùng sau check-in và check-out
  getCheckInCheckOutFinalInspectionRooms: () => api.get('/rooms?status=checkin-checkout-final-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra cuối cùng sau check-in và check-out xong
  getCheckInCheckOutFinalInspectedRooms: () => api.get('/rooms?status=checkin-checkout-final-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao cuối cùng sau check-in và check-out
  getCheckInCheckOutFinalHandoverRooms: () => api.get('/rooms?status=checkin-checkout-final-handover'),
  
  // Lấy danh sách phòng đã bàn giao cuối cùng sau check-in và check-out
  getCheckInCheckOutFinalHandedOverRooms: () => api.get('/rooms?status=checkin-checkout-final-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận cuối cùng sau check-in và check-out
  getCheckInCheckOutFinalReceivingRooms: () => api.get('/rooms?status=checkin-checkout-final-receiving'),
  
  // Lấy danh sách phòng đã nhận cuối cùng sau check-in và check-out
  getCheckInCheckOutFinalReceivedRooms: () => api.get('/rooms?status=checkin-checkout-final-received'),
  
  // Lấy danh sách phòng đang chờ dọn dẹp sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutCleaningRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning'),
  
  // Lấy danh sách phòng đang được dọn dẹp sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutCleaningInProgressRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning-in-progress'),
  
  // Lấy danh sách phòng đã dọn dẹp sau bảo trì, check-in và check-out xong
  getMaintenanceCheckInCheckOutCleaningCompletedRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning-completed'),
  
  // Lấy danh sách phòng đang chờ kiểm tra dọn dẹp sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutCleaningInspectionRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra dọn dẹp sau bảo trì, check-in và check-out xong
  getMaintenanceCheckInCheckOutCleaningInspectedRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao dọn dẹp sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutCleaningHandoverRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning-handover'),
  
  // Lấy danh sách phòng đã bàn giao dọn dẹp sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutCleaningHandedOverRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận dọn dẹp sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutCleaningReceivingRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning-receiving'),
  
  // Lấy danh sách phòng đã nhận dọn dẹp sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutCleaningReceivedRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-cleaning-received'),
  
  // Lấy danh sách phòng đang chờ kiểm tra cuối cùng sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutFinalInspectionRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-final-inspection'),
  
  // Lấy danh sách phòng đã kiểm tra cuối cùng sau bảo trì, check-in và check-out xong
  getMaintenanceCheckInCheckOutFinalInspectedRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-final-inspected'),
  
  // Lấy danh sách phòng đang chờ bàn giao cuối cùng sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutFinalHandoverRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-final-handover'),
  
  // Lấy danh sách phòng đã bàn giao cuối cùng sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutFinalHandedOverRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-final-handed-over'),
  
  // Lấy danh sách phòng đang chờ nhận cuối cùng sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutFinalReceivingRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-final-receiving'),
  
  // Lấy danh sách phòng đã nhận cuối cùng sau bảo trì, check-in và check-out
  getMaintenanceCheckInCheckOutFinalReceivedRooms: () => api.get('/rooms?status=maintenance-checkin-checkout-final-re),ceived'),
};
