import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Typography, Space, Tabs,
  Modal, Form, Input, Select, InputNumber, Divider, List, Tooltip, Drawer,
  Upload, Spin, Switch, Popconfirm, Checkbox, Alert, Segmented, message
} from 'antd';
import {
  KeyOutlined, CheckCircleOutlined, SyncOutlined, UserOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, FileTextOutlined, WarningOutlined, EyeOutlined,
  EyeInvisibleOutlined, PlusCircleOutlined, QrcodeOutlined, PrinterOutlined,
  RollbackOutlined, HomeOutlined, LoadingOutlined, BookOutlined,
  ClearOutlined, BuildOutlined, ExclamationCircleOutlined, AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import MDEditor from '@uiw/react-md-editor';
import axiosClient from '../../api/axios';
import invoiceAPI from '../../api/invoiceAPI';
import momoAPI from '../../api/momoAPI';
import { auditLogger } from '../../utils/auditLogger';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Loading States
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [loadingInHouse, setLoadingInHouse] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Data States
  const [arrivalsData, setArrivalsData] = useState([]);
  const [inHouseData, setInHouseData] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [equipmentsList, setEquipmentsList] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  // Modal & Drawer State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  
  // Modals Open
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isDamageOpen, setIsDamageOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Form Fields State
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [serviceId, setServiceId] = useState(null);
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [damageDescription, setDamageDescription] = useState('');
  const [damagePrice, setDamagePrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);

  // Invoice Details Modal State
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Blog Posting Form/Drawer State
  const [postDrawerOpen, setPostDrawerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingContentImg, setUploadingContentImg] = useState(false);
  const [previewImg, setPreviewImg] = useState('');
  const [postForm] = Form.useForm();

  // Search & Filter
  const [postSearch, setPostSearch] = useState('');
  const [postFilterCat, setPostFilterCat] = useState('all');

  // Quản lý Dọn Phòng & Tình Trạng Phòng
  const [viewMode, setViewMode] = useState('grid'); // 'grid' hoặc 'table'
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('all');
  const [selectedRoomForInventory, setSelectedRoomForInventory] = useState(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [roomInventory, setRoomInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryConfirmed, setInventoryConfirmed] = useState(false);
  const [selectedRoomForAction, setSelectedRoomForAction] = useState(null);
  const [roomActionModalOpen, setRoomActionModalOpen] = useState(false);

  // Load All Init Data
  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoadingOverview(true);
    try {
      await Promise.all([
        fetchArrivals(),
        fetchInHouse(),
        fetchRooms(),
        fetchServicesAndEquipments(),
        fetchRoomTypesAndCategories(),
        fetchPosts()
      ]);
    } catch (err) {
      message.error("Lỗi khi tải đồng bộ dữ liệu tổng quan!");
    } finally {
      setLoadingOverview(false);
    }
  };

  // API fetches
  const fetchArrivals = async () => {
    setLoadingArrivals(true);
    try {
      const res = await axiosClient.get('/Bookings/arrivals');
      setArrivalsData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingArrivals(false);
    }
  };

  const fetchInHouse = async () => {
    setLoadingInHouse(true);
    try {
      const res = await axiosClient.get('/Bookings/in-house');
      setInHouseData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInHouse(false);
    }
  };

  const fetchRooms = async () => {
    setLoadingCheckout(true);
    try {
      const res = await axiosClient.get('/Rooms');
      setRoomsList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const fetchServicesAndEquipments = async () => {
    try {
      const [resS, resE] = await Promise.all([
        axiosClient.get('/Reception/services-list'),
        axiosClient.get('/Reception/equipments-list')
      ]);
      setServicesList(resS.data || []);
      setEquipmentsList(resE.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoomTypesAndCategories = async () => {
    try {
      const [resRT, resC] = await Promise.all([
        axiosClient.get('/RoomTypes/public'),
        axiosClient.get('/Categories')
      ]);
      setRoomTypes(resRT.data || []);
      setCategories(resC.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await axiosClient.get('/Posts');
      setPosts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // --- QUẢN LÝ DỌN PHÒNG & TÌNH TRẠNG PHÒNG ---
  const handleOpenRoomActionModal = (room) => {
    setSelectedRoomForAction(room);
    setRoomActionModalOpen(true);
  };

  const handleOpenRoomInventory = async (room) => {
    setSelectedRoomForInventory(room);
    setInventoryConfirmed(false);
    setIsInventoryModalOpen(true);
    setInventoryLoading(true);
    try {
      const res = await axiosClient.get(`/RoomInventory/rooms/${room.id}/inventory`);
      setRoomInventory(res.data || []);
      
      auditLogger.success(`📋 Lễ tân bắt đầu kiểm tra ${res.data.length} vật tư phòng P.${room.roomNumber}`, {
        action: 'Kiểm tra',
        actionType: 'OTHER',
        module: 'Nhiệm vụ Dọn Phòng',
        objectName: `Phòng ${room.roomNumber}`,
        description: `Bắt đầu kiểm vật tư phòng ${room.roomNumber} trực tiếp từ Bàn Lễ tân.`
      });
    } catch (err) {
      message.error("Lỗi khi tải danh sách vật tư phòng!");
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleCompleteRoomCleaning = async (roomId) => {
    try {
      await axiosClient.put(`/RoomInventory/rooms/${roomId}/mark-clean`, {});
      const room = roomsList.find(r => r.id === roomId);
      message.success(`Đã xác nhận dọn sạch phòng P.${room?.roomNumber || roomId} thành công!`);
      setIsInventoryModalOpen(false);
      
      // Update local action state if open
      if (selectedRoomForAction && selectedRoomForAction.id === roomId) {
        setSelectedRoomForAction(prev => ({ ...prev, status: 'Available', cleaningStatus: 'Clean' }));
      }

      auditLogger.success(`✅ Lễ tân hoàn tất kiểm dọn phòng ${room?.roomNumber}.`, {
        action: 'Hoàn tất',
        actionType: 'UPDATE',
        module: 'Nhiệm vụ Dọn Phòng',
        objectName: `Phòng ${room?.roomNumber}`,
        description: `Lễ tân dọn sạch và chuyển phòng ${room?.roomNumber} sang Sẵn sàng (Available).`
      });

      fetchRooms();
      fetchInHouse();
      fetchArrivals();
    } catch (err) {
      message.error("Lỗi khi xác nhận dọn sạch phòng!");
    }
  };

  const handleReportInventoryDamage = (record, room) => {
    Modal.confirm({
      title: 'Xác nhận báo hỏng / mất vật tư phòng',
      content: <div>Bạn xác nhận vật tư <b style={{ color: 'red' }}>{record.amenity?.name}</b> ở phòng <b>{room.roomNumber}</b> bị hỏng hoặc mất?</div>,
      okText: 'Báo hỏng',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const payload = {
            roomInventoryId: record.id,
            quantity: 1,
            penaltyAmount: record.amenity?.price || record.amenity?.importPrice || 500000,
            description: `Phòng ${room.roomNumber} - Khách làm hỏng/mất ${record.amenity?.name}`,
            status: 'Chưa đền bù'
          };
          await axiosClient.post('/LossAndDamages', payload);
          message.success("Đã lập biên bản báo hỏng vật tư thành công!");
          
          auditLogger.success(`✅ Đã báo hỏng ${record.amenity?.name} tại phòng ${room.roomNumber}!`, {
            action: 'Báo hỏng',
            actionType: 'CREATE',
            module: 'Nhiệm vụ Dọn Phòng',
            objectName: `${record.amenity?.name} - Phòng ${room.roomNumber}`,
            description: `Báo hỏng vật tư: ${record.amenity?.name} tại phòng ${room.roomNumber}. Giá bù đền: ${payload.penaltyAmount.toLocaleString()}đ.`
          });

          // Tải lại inventory
          const res = await axiosClient.get(`/RoomInventory/rooms/${room.id}/inventory`);
          setRoomInventory(res.data || []);
        } catch (err) {
          message.error("Lỗi khi báo hỏng vật tư!");
        }
      }
    });
  };

  const handleManualRoomStatusUpdate = async (roomId, newStatus) => {
    try {
      await axiosClient.put(`/Rooms/${roomId}/status`, JSON.stringify(newStatus));
      message.success(`Đã cập nhật trạng thái phòng thành: ${newStatus}!`);
      
      const room = roomsList.find(r => r.id === roomId);
      
      // Update local action state if open
      if (selectedRoomForAction && selectedRoomForAction.id === roomId) {
        setSelectedRoomForAction(prev => ({ ...prev, status: newStatus }));
      }

      auditLogger.success(`Lễ tân cập nhật trạng thái phòng P.${room?.roomNumber} -> ${newStatus}`, {
        action: 'Cập nhật',
        actionType: 'UPDATE',
        module: 'Quản lý phòng',
        objectName: `Phòng ${room?.roomNumber}`,
        description: `Lễ tân đổi nhanh trạng thái phòng ${room?.roomNumber} sang ${newStatus}.`
      });

      fetchRooms();
      fetchInHouse();
      fetchArrivals();
    } catch (err) {
      message.error("Lỗi khi cập nhật trạng thái phòng!");
    }
  };

  // --- TAB 2: NHẬN PHÒNG (CHECK-IN) ---
  const handleOpenCheckIn = async (record) => {
    setSelectedBooking(record);
    if (record.assignedRoomId) {
      setSelectedRoomId(record.assignedRoomId);
      setAvailableRooms([]);
      setIsCheckInOpen(true);
    } else {
      setSelectedRoomId(null);
      try {
        const res = await axiosClient.get('/Reception/available-rooms');
        setAvailableRooms(res.data || []);
        setIsCheckInOpen(true);
      } catch (err) {
        message.error("Lỗi khi tải phòng trống khả dụng!");
      }
    }
  };

  const submitCheckIn = async () => {
    if (!selectedRoomId) return message.warning("Vui lòng gán phòng trước khi thực hiện nhận phòng!");
    try {
      await axiosClient.post(`/Reception/checkin/${selectedBooking.id}`, selectedRoomId);
      message.success(`Đã nhận phòng thành công cho khách ${selectedBooking.guestName}!`);
      setIsCheckInOpen(false);
      fetchArrivals();
      fetchInHouse();
      fetchRooms();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi xử lý nhận phòng!");
    }
  };

  // --- TAB 3: KHÁCH ĐANG Ở (IN-HOUSE) ---
  const handleOpenService = (record) => {
    setSelectedBooking(record);
    setServiceId(null);
    setServiceQuantity(1);
    setIsServiceOpen(true);
  };

  const submitOrderService = async () => {
    if (!serviceId) return message.warning("Vui lòng chọn dịch vụ!");
    try {
      await axiosClient.post(`/Reception/order-service/${selectedBooking.id}`, {
        serviceId: serviceId,
        quantity: serviceQuantity
      });
      const service = servicesList.find(s => s.id === serviceId);
      auditLogger.success("Ghi nhận dịch vụ thành công!", {
        actionType: "PAYMENT",
        module: "Bàn Lễ tân",
        objectName: `Booking #${selectedBooking.id}`,
        description: `Lễ tân thêm dịch vụ: ${service?.name} x ${serviceQuantity} cho khách ${selectedBooking.guestName}.`
      });
      message.success("Thêm dịch vụ thành công!");
      setIsServiceOpen(false);
    } catch (err) {
      message.error("Lỗi ghi nhận dịch vụ!");
    }
  };

  const handleOpenDamage = (record) => {
    setSelectedBooking(record);
    setDamageDescription('');
    setDamagePrice(0);
    setIsDamageOpen(true);
  };

  const submitReportDamage = async () => {
    if (!damageDescription) return message.warning("Nhập mô tả sự cố hoặc vật dụng!");
    if (damagePrice <= 0) return message.warning("Số tiền phạt phải lớn hơn 0!");
    try {
      await axiosClient.post(`/Reception/report-damage/${selectedBooking.id}`, {
        description: damageDescription,
        fineAmount: damagePrice
      });
      auditLogger.success("Báo hỏng và đền bù thành công!", {
        actionType: "UPDATE",
        module: "Bàn Lễ tân",
        objectName: `Booking #${selectedBooking.id}`,
        description: `Lễ tân báo hỏng đồ: ${damageDescription}, Phí phạt: ${damagePrice.toLocaleString()}đ.`
      });
      message.success("Báo hỏng thành công!");
      setIsDamageOpen(false);
    } catch (err) {
      message.error("Lỗi ghi nhận đền bù!");
    }
  };

  const handleOpenDeposit = (record) => {
    setSelectedBooking(record);
    setDepositAmount(0);
    setIsDepositOpen(true);
  };

  const submitDeposit = async () => {
    if (depositAmount <= 0) return message.warning("Số tiền đặt cọc phải lớn hơn 0!");
    try {
      await axiosClient.post(`/Reception/deposit/${selectedBooking.id}`, {
        amount: depositAmount
      });
      auditLogger.success("Thêm đặt cọc thành công!", {
        actionType: "UPDATE",
        module: "Bàn Lễ tân",
        objectName: `Booking #${selectedBooking.id}`,
        description: `Lễ tân thu thêm cọc của khách ${selectedBooking.guestName}: ${depositAmount.toLocaleString()}đ.`
      });
      message.success("Đã ghi nhận cọc bổ sung!");
      setIsDepositOpen(false);
    } catch (err) {
      message.error("Lỗi ghi nhận cọc!");
    }
  };

  const handleViewPreview = async (record) => {
    setSelectedBooking(record);
    try {
      const res = await invoiceAPI.preview(record.id);
      setBookingDetails(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      message.error("Không lấy được dữ liệu hóa đơn tạm tính!");
    }
  };

  // --- TAB 4: TRẢ PHÒNG & XUẤT HÓA ĐƠN ---
  const handleRequestRoomClean = async (record) => {
    const bookingRooms = roomsList.filter(r => record.roomNumbers?.includes(r.roomNumber));
    Modal.confirm({
      title: `Yêu cầu kiểm phòng cho khách ${record.guestName}?`,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: `Bộ phận Buồng phòng sẽ đến phòng P.${record.roomNumbers?.join(', ')} để kiểm tra tài sản.`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          for (const room of bookingRooms) {
            await axiosClient.put(`/Rooms/${room.id}/status`, JSON.stringify("Pending Check-out"));
          }
          message.success("Đã chuyển phòng sang trạng thái Đang Chờ Kiểm Tra!");
          fetchRooms();
        } catch (err) {
          message.error("Lỗi khi chuyển trạng thái phòng!");
        }
      }
    });
  };

  const handleCheckoutClick = (record) => {
    const bookingRooms = roomsList.filter(r => record.roomNumbers?.includes(r.roomNumber));
    const isPendingInspect = bookingRooms.some(r => r.status === 'Pending Check-out');
    const isClean = bookingRooms.every(r => r.status === 'Available');

    if (!isPendingInspect && !isClean) {
      // Trường hợp 1: Chuyển sang chờ kiểm tra
      Modal.confirm({
        title: `Xác nhận yêu cầu Trả phòng cho khách ${record.guestName}?`,
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        content: `Hệ thống sẽ đổi trạng thái phòng thành "ĐANG CHỜ KIỂM TRA" để Buồng phòng đi check tài sản.`,
        okText: 'Yêu cầu kiểm phòng',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            for (const room of bookingRooms) {
              await axiosClient.put(`/Rooms/${room.id}/status`, JSON.stringify("Pending Check-out"));
            }
            message.success("Yêu cầu kiểm phòng đã gửi!");
            fetchRooms();
          } catch (err) {
            message.error("Lỗi cập nhật!");
          }
        }
      });
    } else if (isPendingInspect) {
      // Trường hợp 2: Đang kiểm phòng, hỏi xem có muốn bỏ qua thanh toán gấp
      Modal.confirm({
        title: `⚠️ Cảnh báo: Phòng đang chờ kiểm tra!`,
        icon: <WarningOutlined style={{ color: '#fa8c16' }} />,
        content: `Nhân viên Buồng phòng đang đi kiểm thực tế. Bạn có muốn bỏ qua kết quả kiểm để thanh toán & trả phòng ngay không?`,
        okText: 'Bỏ qua & Checkout ngay',
        okType: 'danger',
        cancelText: 'Quay lại',
        onOk: async () => {
          await executeCheckout(record, bookingRooms);
        }
      });
    } else {
      // Trường hợp 3: Sạch/Đã kiểm xong
      Modal.confirm({
        title: `Hoàn tất Trả phòng cho khách ${record.guestName}?`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        content: `Xuất hóa đơn chốt sổ cho booking mã ${record.bookingCode}.`,
        okText: 'Xuất hóa đơn & Chốt phòng',
        onOk: async () => {
          await executeCheckout(record, bookingRooms);
        }
      });
    }
  };

  const executeCheckout = async (record, bookingRooms) => {
    try {
      const res = await invoiceAPI.checkout(record.id);
      
      // Chuyển phòng sang Dirty
      for (const room of bookingRooms) {
        if (room.status !== 'Available') {
          await axiosClient.put(`/Rooms/${room.id}/status`, JSON.stringify("Dirty"));
        }
      }
      
      message.success("Xuất hóa đơn checkout thành công!");
      auditLogger.success("Trả phòng thành công!", {
        actionType: "CHECKOUT",
        module: "Bàn Lễ tân",
        objectName: `Booking #${record.id}`,
        description: `Checkout thành công cho đơn đặt phòng ${record.bookingCode}.`
      });

      // Tải và hiển thị hóa đơn thanh toán trực tiếp
      const invoiceId = res.data.invoiceId;
      await openInvoiceDetails(invoiceId);
      
      fetchInHouse();
      fetchRooms();
      fetchArrivals();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi xử lý trả phòng!");
    }
  };

  // --- XỬ LÝ HÓA ĐƠN CHI TIẾT MODAL ---
  const openInvoiceDetails = async (invoiceId) => {
    setInvoiceLoading(true);
    setQrData(null);
    try {
      const res = await invoiceAPI.getById(invoiceId);
      setCurrentInvoice(res.data);
      setIsInvoiceModalOpen(true);

      // Gọi API tải mã QR thanh toán động
      setQrLoading(true);
      try {
        const qrRes = await momoAPI.getPaymentQRByInvoiceId(invoiceId);
        setQrData(qrRes.data);
      } catch (err) {
        console.error("Lỗi tải VietQR:", err);
      } finally {
        setQrLoading(false);
      }
    } catch (err) {
      message.error("Lỗi tải chi tiết hóa đơn!");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleConfirmPayment = () => {
    Modal.confirm({
      title: 'Xác nhận đã nhận tiền?',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: 'Đồng ý xác nhận rằng khách hàng đã thanh toán đầy đủ hóa đơn này bằng Tiền mặt / Thẻ / Chuyển khoản?',
      okText: 'Xác nhận đã nhận đủ tiền',
      onOk: async () => {
        try {
          await invoiceAPI.confirmPayment(currentInvoice.id);
          message.success('Xác nhận thanh toán thành công!');
          // Reload chi tiết hóa đơn
          const res = await invoiceAPI.getById(currentInvoice.id);
          setCurrentInvoice(res.data);
        } catch (err) {
          message.error("Lỗi khi xác nhận thanh toán!");
        }
      }
    });
  };

  const handleCancelInvoice = () => {
    Modal.confirm({
      title: 'Xác nhận HỦY hóa đơn này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Mọi giao dịch sẽ bị thu hồi và phòng sẽ khôi phục về trạng thái "Đang ở".',
      okText: 'Hủy hóa đơn',
      okType: 'danger',
      onOk: async () => {
        try {
          await invoiceAPI.cancel(currentInvoice.id);
          message.success("Hủy hóa đơn thành công! Phòng đã được khôi phục.");
          setIsInvoiceModalOpen(false);
          fetchInHouse();
          fetchRooms();
        } catch (err) {
          message.error("Lỗi khi hủy hóa đơn!");
        }
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // --- TAB 5: ĐĂNG BÀI VIẾT (RECEIVER BLOG) ---
  const handleTogglePublish = async (record) => {
    const dto = {
      title: record.title,
      content: record.content,
      excerpt: record.excerpt,
      imageUrl: record.imageUrl,
      categoryId: record.categoryId,
      roomTypeId: record.roomTypeId,
      isPublished: !record.isPublished,
      isHot: record.isHot,
    };
    try {
      await axiosClient.put(`/Posts/${record.id}`, dto);
      message.success(dto.isPublished ? '✅ Đã xuất bản bài viết!' : '🔒 Đã ẩn bài viết!');
      fetchPosts();
    } catch {
      message.error('Cập nhật trạng thái thất bại!');
    }
  };

  const handleToggleHot = async (record) => {
    const dto = {
      title: record.title,
      content: record.content,
      excerpt: record.excerpt,
      imageUrl: record.imageUrl,
      categoryId: record.categoryId,
      roomTypeId: record.roomTypeId,
      isPublished: record.isPublished,
      isHot: !record.isHot,
    };
    try {
      await axiosClient.put(`/Posts/${record.id}`, dto);
      message.success(dto.isHot ? '🔥 Đã ghim bài viết lên đầu!' : '🧊 Đã hạ ghim bài viết!');
      fetchPosts();
    } catch {
      message.error('Cập nhật trạng thái tin hot thất bại!');
    }
  };

  const openAddPost = () => {
    setEditingPost(null);
    setPostContent('');
    setPreviewImg('');
    postForm.resetFields();
    postForm.setFieldsValue({ isPublished: true, isHot: false });
    setPostDrawerOpen(true);
  };

  const openEditPost = (record) => {
    setEditingPost(record);
    setPostContent(record.content || '');
    setPreviewImg(record.imageUrl || '');
    postForm.setFieldsValue({
      title: record.title,
      excerpt: record.excerpt,
      imageUrl: record.imageUrl,
      categoryId: record.categoryId,
      roomTypeId: record.roomTypeId,
      isPublished: record.isPublished,
      isHot: record.isHot,
    });
    setPostDrawerOpen(true);
  };

  const handleUploadImage = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImg(true);
    try {
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || '';
      postForm.setFieldValue('imageUrl', url);
      setPreviewImg(url);
      message.success('Tải ảnh bìa bài viết lên thành công!');
    } catch {
      message.error('Lỗi tải ảnh lên Cloudinary!');
    } finally {
      setUploadingImg(false);
    }
    return false;
  };

  const handleUploadContentImage = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingContentImg(true);
    try {
      const res = await axiosClient.post('/Upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || '';
      setPostContent(prev => (prev || '') + `\n\n![Mô tả ảnh](${url})\n\n`);
      message.success('Tải ảnh chèn nội dung thành công!');
    } catch {
      message.error('Lỗi tải ảnh chèn!');
    } finally {
      setUploadingContentImg(false);
    }
    return false;
  };

  const handleSavePost = async () => {
    try {
      const values = await postForm.validateFields();
      if (!postContent || postContent === '<p><br></p>') {
        return message.warning('Vui lòng soạn nội dung bài viết!');
      }
      const dto = { ...values, content: postContent };
      setLoadingPosts(true);
      if (editingPost) {
        await axiosClient.put(`/Posts/${editingPost.id}`, dto);
        message.success('Cập nhật bài viết thành công!');
      } else {
        await axiosClient.post('/Posts', dto);
        message.success('Đăng bài viết mới thành công!');
      }
      setPostDrawerOpen(false);
      fetchPosts();
    } catch (e) {
      if (!e?.errorFields) message.error('Có lỗi xảy ra!');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await axiosClient.delete(`/Posts/${id}`);
      message.success('Đã xóa bài viết!');
      fetchPosts();
    } catch {
      message.error('Xóa thất bại!');
    }
  };

  // Filtered Posts
  const filteredPosts = posts.filter(p => {
    const matchS = p.title?.toLowerCase().includes(postSearch.toLowerCase());
    const matchC = postFilterCat === 'all' || p.categoryId === parseInt(postFilterCat);
    return matchS && matchC;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Filtered Rooms
  const filteredRooms = roomsList.filter(r => {
    const matchSearch = r.roomNumber?.toString().toLowerCase().includes(roomSearchQuery.toLowerCase()) || r.roomTypeName?.toLowerCase().includes(roomSearchQuery.toLowerCase());
    
    let matchStatus = false;
    if (roomStatusFilter === 'all') {
      matchStatus = true;
    } else if (roomStatusFilter === 'Available') {
      matchStatus = r.status === 'Available' || r.status === 'Trống';
    } else if (roomStatusFilter === 'Occupied') {
      matchStatus = r.status === 'Occupied' || r.status === 'Đang ở';
    } else if (roomStatusFilter === 'Dirty') {
      matchStatus = r.status === 'Dirty' || r.status === 'Chờ dọn dẹp';
    } else if (roomStatusFilter === 'Cleaning') {
      matchStatus = r.status === 'Cleaning' || r.status === 'Đang dọn';
    } else if (roomStatusFilter === 'Pending Check-out') {
      matchStatus = r.status === 'Pending Check-out' || r.status === 'Chờ kiểm tra';
    }
    
    return matchSearch && matchStatus;
  });

  // Group Rooms by Floor for Layout Grid
  const getRoomsByFloor = () => {
    const sortedRooms = [...filteredRooms].sort((a, b) => {
      const numA = parseInt(a.roomNumber) || 0;
      const numB = parseInt(b.roomNumber) || 0;
      return numA - numB;
    });

    const floors = {};
    sortedRooms.forEach(room => {
      const numStr = room.roomNumber?.toString() || "";
      let floorName = "Tầng Khác";
      
      const match = numStr.match(/\d/);
      if (match) {
        floorName = `Tầng ${match[0]}`;
      }
      
      if (!floors[floorName]) floors[floorName] = [];
      floors[floorName].push(room);
    });

    return floors;
  };

  // Thống kê nhanh số phòng
  const countAvailable = roomsList.filter(r => r.status === 'Available' || r.status === 'Trống').length;
  const countOccupied = roomsList.filter(r => r.status === 'Occupied' || r.status === 'Đang ở').length;
  const countDirty = roomsList.filter(r => r.status === 'Dirty' || r.status === 'Chờ dọn dẹp').length;

  // --- TABLES COLUMNS ---

  const arrivalsColumns = [
    { title: 'Mã Booking', dataIndex: 'bookingCode', render: text => <b style={{ color: '#1890ff', whiteSpace: 'nowrap' }}>{text}</b> },
    { title: 'Khách hàng', dataIndex: 'guestName', render: text => <b>{text || 'Khách vãng lai'}</b> },
    { title: 'Số điện thoại', dataIndex: 'guestPhone' },
    { title: 'Loại phòng', dataIndex: 'roomTypeName', render: text => <Tag color="blue">{text}</Tag> },
    { title: 'Số phòng', dataIndex: 'assignedRoomNumber', render: text => text ? <Tag color="green" style={{ fontSize: 13, fontWeight: 'bold' }}>P.{text}</Tag> : <Tag color="red">Chưa gán</Tag> },
    { title: 'Ngày nhận', dataIndex: 'checkInDate', render: date => dayjs(date).format('HH:mm - DD/MM') },
    {
      title: 'Nhận phòng', align: 'center', render: (_, record) => (
        <Button
          type="primary"
          icon={<KeyOutlined />}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          onClick={() => handleOpenCheckIn(record)}
        >
          Check-in
        </Button>
      )
    }
  ];

  const inHouseColumns = [
    { title: 'Mã Booking', dataIndex: 'bookingCode', render: text => <b style={{ whiteSpace: 'nowrap' }}>{text}</b> },
    { title: 'Khách hàng', dataIndex: 'guestName', render: text => <b>{text || 'Khách vãng lai'}</b> },
    { title: 'Số điện thoại', dataIndex: 'guestPhone' },
    { title: 'Phòng đang ở', dataIndex: 'roomNumbers', render: rooms => <Space wrap>{rooms?.map(r => <Tag color="orange" key={r}>P.{r}</Tag>)}</Space> },
    { title: 'Ngày nhận phòng', dataIndex: 'checkInDate', render: date => dayjs(date).format('HH:mm - DD/MM') },
    {
      title: 'Dịch vụ phát sinh & cọc', align: 'center', render: (_, record) => (
        <Space>
          <Tooltip title="Xem hóa đơn tạm tính">
            <Button icon={<EyeOutlined />} onClick={() => handleViewPreview(record)} />
          </Tooltip>
          <Button type="dashed" icon={<PlusCircleOutlined />} onClick={() => handleOpenService(record)} style={{ color: '#1890ff', borderColor: '#1890ff' }}>
            + Dịch vụ
          </Button>
          <Button danger icon={<WarningOutlined />} onClick={() => handleOpenDamage(record)}>
            Phạt hỏng đồ
          </Button>
          <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => handleOpenDeposit(record)}>
            Thu cọc
          </Button>
        </Space>
      )
    }
  ];

  const checkoutColumns = [
    { title: 'Mã Booking', dataIndex: 'bookingCode', render: text => <b>{text}</b> },
    { title: 'Khách hàng', dataIndex: 'guestName', render: text => <b>{text}</b> },
    {
      title: 'Phòng & Trạng thái dọn phòng', dataIndex: 'roomNumbers',
      render: (rooms, record) => (
        <Space wrap>
          {rooms?.map(roomNum => {
            const roomObj = roomsList.find(r => r.roomNumber === roomNum);
            const status = roomObj?.status;
            let color = 'default';
            let label = `P.${roomNum}`;

            if (status === 'Pending Check-out') {
              color = 'gold';
              label = `P.${roomNum} (Đang chờ kiểm phòng ⏳)`;
            } else if (status === 'Available') {
              color = 'green';
              label = `P.${roomNum} (Đã kiểm sạch ✅)`;
            } else if (status === 'Dirty') {
              color = 'orange';
              label = `P.${roomNum} (Chờ dọn dẹp 🧹)`;
            } else {
              color = 'blue';
              label = `P.${roomNum} (Khách đang ở 🔑)`;
            }

            return (
              <Tag color={color} key={roomNum} style={{ fontSize: 12, fontWeight: 'bold' }}>
                {label}
              </Tag>
            );
          })}
        </Space>
      )
    },
    { title: 'Ngày Check-in', dataIndex: 'checkInDate', render: date => dayjs(date).format('HH:mm - DD/MM') },
    {
      title: 'Xử lý trả phòng', align: 'center',
      render: (_, record) => {
        const bookingRooms = roomsList.filter(r => record.roomNumbers?.includes(r.roomNumber));
        const isPendingInspect = bookingRooms.some(r => r.status === 'Pending Check-out');
        const isClean = bookingRooms.every(r => r.status === 'Available');

        return (
          <Space>
            <Tooltip title="Xem trước hóa đơn tạm thời">
              <Button icon={<EyeOutlined />} onClick={() => handleViewPreview(record)}>Chi phí</Button>
            </Tooltip>
            {!isPendingInspect && !isClean && (
              <Button
                style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }}
                onClick={() => handleRequestRoomClean(record)}
              >
                🔔 Yêu cầu kiểm phòng
              </Button>
            )}
            <Button
              type="primary"
              danger={!isClean}
              style={{
                backgroundColor: isClean ? '#52c41a' : undefined,
                borderColor: isClean ? '#52c41a' : undefined
              }}
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckoutClick(record)}
            >
              {isClean ? 'Trả phòng & Xuất HĐ' : 'Trả phòng ngay'}
            </Button>
          </Space>
        );
      }
    }
  ];

  const postColumns = [
    {
      title: 'Bài viết', dataIndex: 'title', key: 'title',
      render: (t, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {r.imageUrl
            ? <img src={r.imageUrl} alt="" style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 6 }} onError={e => e.target.style.display = 'none'} />
            : <div style={{ width: 56, height: 42, background: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>📄</div>
          }
          <div>
            <Text strong style={{ fontSize: 14 }}>{t}</Text>
            {r.excerpt && <div><Text type="secondary" style={{ fontSize: 12 }}>{r.excerpt.substring(0, 60)}...</Text></div>}
          </div>
        </div>
      )
    },
    { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName', width: 130, render: t => t ? <Tag color="blue">{t}</Tag> : <Tag>—</Tag> },
    {
      title: 'Trạng thái hiển thị', dataIndex: 'isPublished', key: 'isPublished', width: 120, align: 'center',
      render: (v, record) => (
        <Switch
          checked={v}
          onChange={() => handleTogglePublish(record)}
          checkedChildren={<><EyeOutlined /> Hiện</>}
          unCheckedChildren={<><EyeInvisibleOutlined /> Ẩn</>}
        />
      )
    },
    {
      title: 'Ghim trang chủ 🔥', dataIndex: 'isHot', key: 'isHot', width: 110, align: 'center',
      render: (v, record) => (
        <Switch
          checked={v}
          onChange={() => handleToggleHot(record)}
          checkedChildren="Hot 🔥"
          unCheckedChildren="Thường"
        />
      )
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: d => d ? dayjs(d).format('DD/MM/YYYY') : '—' },
    {
      title: 'Thao tác', key: 'action', width: 100, align: 'center',
      render: (_, r) => (
        <Space>
          <Button type="primary" ghost icon={<EditOutlined />} size="small" onClick={() => openEditPost(r)} />
          <Popconfirm title="Xóa bài viết này?" onConfirm={() => handleDeletePost(r.id)} okText="Xóa" cancelText="Hủy" okType="danger">
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      )
    },
  ];

  const roomsColumns = [
    { title: 'Số phòng', dataIndex: 'roomNumber', render: text => <b style={{ fontSize: 15 }}>P.{text}</b> },
    { title: 'Loại phòng', dataIndex: 'roomTypeName', render: text => <Tag color="cyan">{text}</Tag> },
    {
      title: 'Trạng thái vật lý', dataIndex: 'status',
      render: (status, record) => {
        let color = 'default';
        if (status === 'Available' || status === 'Trống') color = 'green';
        else if (status === 'Occupied' || status === 'Đang ở') color = 'blue';
        else if (status === 'Dirty' || status === 'Chờ dọn dẹp') color = 'orange';
        else if (status === 'Cleaning' || status === 'Đang dọn') color = 'processing';
        else if (status === 'Pending Check-out' || status === 'Chờ kiểm tra') color = 'gold';

        return (
          <Select
            value={status === 'Trống' ? 'Available' : status === 'Đang ở' ? 'Occupied' : status === 'Chờ dọn dẹp' ? 'Dirty' : status === 'Đang dọn' ? 'Cleaning' : status === 'Chờ kiểm tra' ? 'Pending Check-out' : status}
            onChange={(val) => handleManualRoomStatusUpdate(record.id, val)}
            style={{ width: 160 }}
          >
            <Option value="Available"><Tag color="green">Sẵn sàng (Clean)</Tag></Option>
            <Option value="Occupied"><Tag color="blue">Đang ở (Occupied)</Tag></Option>
            <Option value="Dirty"><Tag color="orange">Bẩn (Dirty)</Tag></Option>
            <Option value="Cleaning"><Tag color="cyan">Đang dọn (Cleaning)</Tag></Option>
            <Option value="Pending Check-out"><Tag color="gold">Chờ Checkout (Pending)</Tag></Option>
          </Select>
        );
      }
    },
    {
      title: 'Tình trạng dọn dẹp', dataIndex: 'cleaningStatus',
      render: (status) => {
        let color = 'default';
        let label = status || 'Bẩn';
        if (status === 'Clean' || status === 'Sạch') { color = 'green'; label = 'Đã dọn sạch'; }
        else if (status === 'Dirty' || status === 'Bẩn') { color = 'orange'; label = 'Chưa dọn dẹp'; }
        else if (status === 'Inspecting' || status === 'Đang kiểm tra') { color = 'gold'; label = 'Đang kiểm tra'; }
        
        return <Tag color={color} style={{ fontWeight: 'bold' }}>{label}</Tag>;
      }
    },
    {
      title: 'Thao tác cập nhật', align: 'center',
      render: (_, record) => {
        const isDirtyOrCleaning = record.status === 'Dirty' || record.status === 'Cleaning' || record.status === 'Pending Check-out';
        return (
          <Space>
            {isDirtyOrCleaning && (
              <Popconfirm title="Xác nhận dọn sạch phòng này ngay?" onConfirm={() => handleCompleteRoomCleaning(record.id)} okText="Sạch" cancelText="Hủy">
                <Button type="primary" size="small" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} icon={<CheckCircleOutlined />}>
                  Xác nhận dọn sạch
                </Button>
              </Popconfirm>
            )}
            <Button size="small" type="dashed" icon={<BuildOutlined />} onClick={() => handleOpenRoomInventory(record)}>
              Kiểm vật tư
            </Button>
          </Space>
        );
      }
    }
  ];

  const roomsByFloor = getRoomsByFloor();

  return (
    <div style={{ padding: '24px 28px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>🛎️ BÀN LÀM VIỆC LỄ TÂN (RECEPTIONIST PANEL)</Title>
          <Text type="secondary">Cổng điều hành lễ tân tích hợp, quản lý check-in, check-out, hóa đơn và đăng tin tức</Text>
        </div>
        <Button type="primary" size="large" icon={<SyncOutlined />} onClick={fetchOverviewData} loading={loadingOverview}>
          Đồng bộ lại dữ liệu
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: <span><HomeOutlined /> Tổng Quan</span>,
              children: (
                <div>
                  <Row gutter={[16, 16]} style={{ marginBottom: 24, marginTop: 12 }}>
                    <Col xs={24} sm={12} xl={6}>
                      <Card variant="borderless" style={{ background: '#e6f7ff', borderRadius: 8 }}>
                        <Statistic title="Phòng Trống Sạch" value={countAvailable} prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />} styles={{ content: { color: '#1890ff', fontWeight: 'bold' } }} />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                      <Card variant="borderless" style={{ background: '#fff1f0', borderRadius: 8 }}>
                        <Statistic title="Khách Đang Lưu Trú (Phòng ở)" value={countOccupied} prefix={<UserOutlined style={{ color: '#cf1322' }} />} styles={{ content: { color: '#cf1322', fontWeight: 'bold' } }} />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                      <Card variant="borderless" style={{ background: '#fffbe6', borderRadius: 8 }}>
                        <Statistic title="Phòng Chờ Dọn Dẹp" value={countDirty} prefix={<SyncOutlined spin style={{ color: '#faad14' }} />} styles={{ content: { color: '#faad14', fontWeight: 'bold' } }} />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                      <Card variant="borderless" style={{ background: '#f6ffed', borderRadius: 8 }}>
                        <Statistic title="Khách Đang Đợi Check-in" value={arrivalsData.length} prefix={<KeyOutlined style={{ color: '#52c41a' }} />} styles={{ content: { color: '#52c41a', fontWeight: 'bold' } }} />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[24, 24]}>
                    <Col xs={24} xxl={12}>
                      <Card title="🧳 Khách Dự Kiến Đến Hôm Nay" variant="borderless" styles={{ header: { fontWeight: 'bold' } }}>
                        <Table scroll={{ x: 'max-content' }}
                          columns={arrivalsColumns.slice(0, 5).concat([{
                            title: 'Thao tác', align: 'center',
                            render: (_, record) => <Button type="primary" size="small" onClick={() => handleOpenCheckIn(record)}>Check-in</Button>
                          }])}
                          dataSource={arrivalsData.slice(0, 5)}
                          rowKey="id"
                          pagination={false}
                          size="small"
                        />
                        {arrivalsData.length > 5 && (
                          <div style={{ textAlign: 'right', marginTop: 12 }}>
                            <Button type="link" onClick={() => setActiveTab('arrivals')}>Xem thêm tất cả {arrivalsData.length} khách đến →</Button>
                          </div>
                        )}
                      </Card>
                    </Col>
                    <Col xs={24} xxl={12}>
                      <Card title="🚪 Khách Cần Trả Phòng Hôm Nay" variant="borderless" styles={{ header: { fontWeight: 'bold' } }}>
                        <Table scroll={{ x: 'max-content' }}
                          columns={[
                            { title: 'Khách hàng', dataIndex: 'guestName', render: text => <b>{text}</b> },
                            { title: 'Số phòng', dataIndex: 'roomNumbers', render: rooms => rooms?.map(r => <Tag color="blue" key={r}>P.{r}</Tag>) },
                            { title: 'Ngày check-in', dataIndex: 'checkInDate', render: date => dayjs(date).format('HH:mm - DD/MM') },
                            {
                              title: 'Thao tác', align: 'center',
                              render: (_, record) => <Button type="primary" danger size="small" onClick={() => handleCheckoutClick(record)}>Checkout</Button>
                            }
                          ]}
                          dataSource={inHouseData.slice(0, 5)}
                          rowKey="id"
                          pagination={false}
                          size="small"
                        />
                        {inHouseData.length > 5 && (
                          <div style={{ textAlign: 'right', marginTop: 12 }}>
                            <Button type="link" onClick={() => setActiveTab('checkout')}>Xem tất cả {inHouseData.length} phòng đang lưu trú →</Button>
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'arrivals',
              label: <span><KeyOutlined /> Nhận Phòng ({arrivalsData.length})</span>,
              children: (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 16 }}>Danh Sách Khách Hàng Chuẩn Bị Nhận Phòng Trong Ngày</Text>
                    <Button icon={<SyncOutlined />} onClick={fetchArrivals}>Tải Lại</Button>
                  </div>
                  <Table scroll={{ x: 'max-content' }} columns={arrivalsColumns} dataSource={arrivalsData} rowKey="id" loading={loadingArrivals} />
                </div>
              )
            },
            {
              key: 'inhouse',
              label: <span><UserOutlined /> Đang Lưu Trú ({inHouseData.length})</span>,
              children: (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 16 }}>Ghi Số Dịch Vụ - Phát Sinh - Đặt Cọc Cho Khách Hàng Đang Lưu Trú</Text>
                    <Button icon={<SyncOutlined />} onClick={fetchInHouse}>Tải Lại</Button>
                  </div>
                  <Table scroll={{ x: 'max-content' }} columns={inHouseColumns} dataSource={inHouseData} rowKey="id" loading={loadingInHouse} />
                </div>
              )
            },
            {
              key: 'checkout',
              label: <span><CheckCircleOutlined /> Trả Phòng</span>,
              children: (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 16 }}>Quy Trình Kiểm Tra Phòng, Thanh Toán QR Động & Tất Toán Hóa Đơn</Text>
                    <Button icon={<SyncOutlined />} onClick={fetchRooms}>Cập Nhật Buồng Phòng</Button>
                  </div>
                  <Table scroll={{ x: 'max-content' }} columns={checkoutColumns} dataSource={inHouseData} rowKey="id" loading={loadingCheckout} />
                </div>
              )
            },
            {
              key: 'housekeeping',
              label: <span><ClearOutlined /> Buồng Phòng</span>,
              children: (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <Space size="middle" wrap>
                      <Search placeholder="Tìm số phòng, loại phòng..." value={roomSearchQuery} onChange={e => setRoomSearchQuery(e.target.value)} style={{ width: 240 }} allowClear />
                      <Select style={{ width: 170 }} value={roomStatusFilter} onChange={setRoomStatusFilter}>
                        <Option value="all">Tất cả trạng thái</Option>
                        <Option value="Available">Trống (Available)</Option>
                        <Option value="Occupied">Đang ở (Occupied)</Option>
                        <Option value="Dirty">Bẩn (Dirty)</Option>
                        <Option value="Cleaning">Đang dọn (Cleaning)</Option>
                        <Option value="Pending Check-out">Chờ Checkout (Pending)</Option>
                      </Select>
                      <Segmented
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                          { label: 'Sơ đồ phòng', value: 'grid', icon: <AppstoreOutlined /> },
                          { label: 'Dạng bảng', value: 'table', icon: <UnorderedListOutlined /> }
                        ]}
                      />
                    </Space>
                    <Button icon={<SyncOutlined />} onClick={fetchRooms}>Tải Lại Phòng</Button>
                  </div>

                  <Spin spinning={loadingCheckout}>
                    {viewMode === 'table' ? (
                      <Table scroll={{ x: 'max-content' }} columns={roomsColumns} dataSource={filteredRooms} rowKey="id" pagination={{ pageSize: 10 }} />
                    ) : (
                      <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #f0f0f0' }}>
                        {Object.keys(roomsByFloor).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Không tìm thấy phòng phù hợp bộ lọc.</div>
                        ) : (
                          Object.keys(roomsByFloor).sort().map(floor => (
                            <div key={floor} style={{ marginBottom: 24 }}>
                              <div style={{ fontSize: 15, fontWeight: 'bold', borderLeft: '4px solid #1890ff', paddingLeft: 8, marginBottom: 14, color: '#262626' }}>
                                {floor}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                {roomsByFloor[floor].map(room => {
                                  let bgColor = '#f5f5f5';
                                  let borderColor = '#d9d9d9';
                                  let textColor = '#262626';
                                  let statusText = 'Trống';
                                  let cleanIcon = null;

                                  const status = room.status;
                                  if (status === 'Available' || status === 'Trống') {
                                    bgColor = '#f6ffed';
                                    borderColor = '#b7eb8f';
                                    textColor = '#389e0d';
                                    statusText = 'Sẵn sàng';
                                  } else if (status === 'Occupied' || status === 'Đang ở') {
                                    bgColor = '#e6f7ff';
                                    borderColor = '#91d5ff';
                                    textColor = '#096dd9';
                                    statusText = 'Có khách';
                                  } else if (status === 'Dirty' || status === 'Chờ dọn dẹp') {
                                    bgColor = '#fff2e8';
                                    borderColor = '#ffbb96';
                                    textColor = '#d4380d';
                                    statusText = 'Phòng bẩn';
                                  } else if (status === 'Cleaning' || status === 'Đang dọn') {
                                    bgColor = '#f9f0ff';
                                    borderColor = '#d3adf7';
                                    textColor = '#722ed1';
                                    statusText = 'Đang dọn';
                                  } else if (status === 'Pending Check-out' || status === 'Chờ kiểm tra') {
                                    bgColor = '#fffbe6';
                                    borderColor = '#ffe58f';
                                    textColor = '#d46b08';
                                    statusText = 'Chờ kiểm';
                                  }

                                  if (room.cleaningStatus === 'Clean' || room.cleaningStatus === 'Sạch') {
                                    cleanIcon = <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 13 }} />;
                                  } else {
                                    cleanIcon = <WarningOutlined style={{ color: '#faad14', fontSize: 13 }} />;
                                  }

                                  return (
                                    <Tooltip
                                      key={room.id}
                                      title={
                                        <div>
                                          <b>Phòng {room.roomNumber}</b> ({room.roomTypeName})
                                          <br />
                                          Trạng thái: {room.status}
                                          <br />
                                          Vệ sinh: {room.cleaningStatus === 'Clean' ? 'Đã dọn sạch' : 'Chưa dọn dẹp'}
                                        </div>
                                      }
                                    >
                                      <Card
                                        hoverable
                                        onClick={() => handleOpenRoomActionModal(room)}
                                        style={{
                                          width: 120,
                                          height: 120,
                                          borderRadius: 12,
                                          border: `2px solid ${borderColor}`,
                                          background: bgColor,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          textAlign: 'center',
                                          padding: 8,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                        }}
                                        styles={{ body: { padding: 0 } }}
                                      >
                                        <div style={{ fontSize: 18, fontWeight: 'bold', color: textColor }}>
                                          P.{room.roomNumber}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {room.roomTypeName}
                                        </div>
                                        <div style={{ marginTop: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                                          {cleanIcon}
                                          <span style={{ fontSize: 10, color: textColor, fontWeight: 'bold' }}>{statusText}</span>
                                        </div>
                                      </Card>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </Spin>
                </div>
              )
            },
            {
              key: 'blog',
              label: <span><BookOutlined /> Tin Tức</span>,
              children: (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <Space>
                      <Search placeholder="Tìm theo tiêu đề..." value={postSearch} onChange={e => setPostSearch(e.target.value)} style={{ width: 260 }} allowClear />
                      <Select style={{ width: 170 }} value={postFilterCat} onChange={setPostFilterCat}>
                        <Option value="all">Tất cả danh mục</Option>
                        {categories.map(c => <Option key={c.id} value={c.id.toString()}>{c.name}</Option>)}
                      </Select>
                    </Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddPost}>
                      Viết bài mới
                    </Button>
                  </div>
                  <Table scroll={{ x: 'max-content' }} columns={postColumns} dataSource={filteredPosts} rowKey="id" loading={loadingPosts} pagination={{ pageSize: 8 }} />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* --- MODALS & DRAWERS --- */}

      {/* MODAL ACTION PHÒNG TỪ SƠ ĐỒ PHÒNG */}
      <Modal
        title={`Điều hành nhanh Phòng P.${selectedRoomForAction?.roomNumber}`}
        open={roomActionModalOpen}
        onCancel={() => setRoomActionModalOpen(false)}
        footer={null}
        width={400}
        centered
        destroyOnHidden
      >
        {selectedRoomForAction && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <p>Loại phòng: <b>{selectedRoomForAction.roomTypeName}</b></p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <span>Trạng thái phòng:</span>
                <Select
                  value={selectedRoomForAction.status === 'Trống' ? 'Available' : selectedRoomForAction.status === 'Đang ở' ? 'Occupied' : selectedRoomForAction.status === 'Chờ dọn dẹp' ? 'Dirty' : selectedRoomForAction.status === 'Đang dọn' ? 'Cleaning' : selectedRoomForAction.status === 'Chờ kiểm tra' ? 'Pending Check-out' : selectedRoomForAction.status}
                  onChange={(val) => handleManualRoomStatusUpdate(selectedRoomForAction.id, val)}
                  style={{ width: 180 }}
                >
                  <Option value="Available"><Tag color="green">Sẵn sàng (Clean)</Tag></Option>
                  <Option value="Occupied"><Tag color="blue">Đang ở (Occupied)</Tag></Option>
                  <Option value="Dirty"><Tag color="orange">Bẩn (Dirty)</Tag></Option>
                  <Option value="Cleaning"><Tag color="cyan">Đang dọn (Cleaning)</Tag></Option>
                  <Option value="Pending Check-out"><Tag color="gold">Chờ Checkout (Pending)</Tag></Option>
                </Select>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span>Tình trạng vệ sinh:</span>
                <Tag color={selectedRoomForAction.cleaningStatus === 'Clean' || selectedRoomForAction.cleaningStatus === 'Sạch' ? 'green' : 'orange'} style={{ fontWeight: 'bold' }}>
                  {selectedRoomForAction.cleaningStatus === 'Clean' || selectedRoomForAction.cleaningStatus === 'Sạch' ? 'Đã dọn sạch' : 'Chưa dọn dẹp'}
                </Tag>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {(selectedRoomForAction.status === 'Dirty' || selectedRoomForAction.status === 'Cleaning' || selectedRoomForAction.status === 'Pending Check-out') && (
                <Button
                  type="primary"
                  block
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => {
                    handleCompleteRoomCleaning(selectedRoomForAction.id);
                    setRoomActionModalOpen(false);
                  }}
                >
                  Xác nhận dọn sạch phòng
                </Button>
              )}
              <Button
                type="dashed"
                block
                icon={<BuildOutlined />}
                onClick={() => {
                  setRoomActionModalOpen(false);
                  handleOpenRoomInventory(selectedRoomForAction);
                }}
              >
                Kiểm kê tài sản & Báo hỏng vật tư
              </Button>
              <Button block onClick={() => setRoomActionModalOpen(false)}>Đóng hộp thoại</Button>
            </Space>
          </div>
        )}
      </Modal>

      {/* MODAL CHECK-IN */}
      <Modal title="Thủ tục Check-in cho khách" open={isCheckInOpen} onOk={submitCheckIn} onCancel={() => setIsCheckInOpen(false)} okText="Xác nhận Nhận Phòng" cancelText="Hủy">
        <div style={{ margin: '12px 0' }}>
          <p>Tên khách hàng: <b>{selectedBooking?.guestName}</b></p>
          <p>Mã Booking: <Tag color="blue">{selectedBooking?.bookingCode}</Tag></p>
          {selectedBooking?.assignedRoomId ? (
            <div style={{ marginTop: 20 }}>
              <Text strong>Khách đã được sắp xếp phòng trước:</Text>
              <div style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold', marginTop: 12, textAlign: 'center', padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px' }}>
                Phòng {selectedBooking.assignedRoomNumber}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              <Text strong>Chọn phòng trống giao cho khách:</Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="-- Danh sách phòng trống sạch sẵn sàng --"
                onChange={(val) => setSelectedRoomId(val)}
                options={availableRooms.map(r => ({ value: r.id, label: `Phòng số ${r.roomNumber}` }))}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL GỌI DỊCH VỤ */}
      <Modal title="Ghi sổ dịch vụ phát sinh" open={isServiceOpen} onOk={submitOrderService} onCancel={() => setIsServiceOpen(false)} okText="Ghi nhận dịch vụ" cancelText="Hủy">
        <div style={{ margin: '12px 0' }}>
          <p>Thêm dịch vụ cho: <b>{selectedBooking?.guestName}</b></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <div style={{ marginBottom: 4 }}><b>Chọn dịch vụ khách gọi:</b></div>
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder="-- Gõ để tìm kiếm món/dịch vụ --"
                value={serviceId}
                onChange={setServiceId}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={servicesList.map(s => ({ value: s.id, label: `${s.name} - Giá: ${s.price?.toLocaleString()}đ` }))}
              />
            </div>
            <div>
              <div style={{ marginBottom: 4 }}><b>Số lượng:</b></div>
              <InputNumber min={1} value={serviceQuantity} onChange={setServiceQuantity} style={{ width: 120 }} />
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL BÁO HỎNG ĐỒ */}
      <Modal title="Báo hỏng vật dụng phòng & Phạt đền bù" open={isDamageOpen} onOk={submitReportDamage} onCancel={() => setIsDamageOpen(false)} okText="Ghi nhận Phạt" okType="danger" cancelText="Hủy">
        <div style={{ margin: '12px 0' }}>
          <p>Phạt đền bù phòng khách: <b>{selectedBooking?.guestName}</b></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <div>
              <div style={{ marginBottom: 4 }}><b>Chọn vật tư hư hại:</b></div>
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder="-- Chọn vật tư hỏng --"
                value={damageDescription}
                onChange={(value) => {
                  setDamageDescription(value);
                  const eq = equipmentsList.find(e => e.name === value);
                  if (eq) setDamagePrice(eq.price);
                }}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={equipmentsList.map(e => ({ value: e.name, label: `${e.name} - Phí đền bù: ${e.price?.toLocaleString()}đ` }))}
              />
            </div>
            <div>
              <div style={{ marginBottom: 4 }}><b>Phí phạt đền bù (VNĐ):</b></div>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                value={damagePrice}
                onChange={setDamagePrice}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL THÊM ĐẶT CỌC */}
      <Modal title="Thu thêm tiền đặt cọc phát sinh" open={isDepositOpen} onOk={submitDeposit} onCancel={() => setIsDepositOpen(false)} okText="Xác nhận thu cọc" cancelText="Hủy">
        <div style={{ margin: '12px 0' }}>
          <p>Thu thêm tiền cọc của khách: <b>{selectedBooking?.guestName}</b></p>
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 4 }}><b>Số tiền cọc nộp thêm (VNĐ):</b></div>
            <InputNumber
              min={1000}
              step={50000}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              value={depositAmount}
              onChange={setDepositAmount}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL XEM CHI TIẾT TẠM TÍNH TIÊU THỤ */}
      <Modal title={`Xem trước chi phí - ${selectedBooking?.guestName}`} open={isDetailOpen} onCancel={() => setIsDetailOpen(false)} footer={[<Button key="close" onClick={() => setIsDetailOpen(false)}>Đóng</Button>]}>
        {bookingDetails && (
          <div>
            <p><b>Mã Đặt Phòng:</b> {bookingDetails.bookingCode}</p>
            <Divider style={{ margin: '12px 0' }} />
            <Text strong>Tạm tính chi phí phòng & dịch vụ:</Text>
            <List
              size="small"
              bordered
              style={{ marginTop: 10 }}
              dataSource={[
                { title: 'Tiền phòng', amount: bookingDetails.totalRoomAmount },
                { title: 'Tiền Dịch vụ phát sinh', amount: bookingDetails.totalServiceAmount },
                { title: 'Tiền đền bù thiết bị', amount: bookingDetails.totalPenaltyAmount },
                { title: 'Thuế giá trị gia tăng (VAT 8%)', amount: bookingDetails.taxAmount },
                ...(bookingDetails.depositAmount > 0 ? [{ title: 'Tiền đã đặt cọc (Trừ trực tiếp)', amount: -bookingDetails.depositAmount }] : []),
              ]}
              renderItem={item => (
                <List.Item style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.title}</span>
                  <b style={{ color: item.title === 'Tiền đền bù thiết bị' && item.amount > 0 ? '#f5222d' : item.title.includes('đặt cọc') ? '#52c41a' : 'inherit' }}>
                    {item.amount > 0 ? item.amount?.toLocaleString() : item.amount?.toLocaleString()} đ
                  </b>
                </List.Item>
              )}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 16 }}>
              <Text strong style={{ color: '#f5222d' }}>TỔNG CỘNG TẠM TÍNH:</Text>
              <Text strong style={{ color: '#f5222d' }}>{bookingDetails.finalTotal?.toLocaleString()} đ</Text>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL TỜ HÓA ĐƠN CHI TIẾT SAU CHECKOUT (PRINT FRIENDLY) */}
      <Modal
        title={null}
        open={isInvoiceModalOpen}
        onCancel={() => setIsInvoiceModalOpen(false)}
        footer={null}
        width={850}
        centered
        destroyOnHidden
      >
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #printable-invoice-modal, #printable-invoice-modal * { visibility: visible; }
            #printable-invoice-modal { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; }
            .no-print-area { display: none !important; }
          }
        `}</style>
        <Spin spinning={invoiceLoading}>
          {currentInvoice && (
            <div id="printable-invoice-modal" style={{ padding: '20px' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 30 }}>
                <Col>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>HOTEL IT CODE</Title>
                  <Text type="secondary">123 Đường Lê Hoàng Tuấn, phường Biên Hòa, Đồng Nai</Text>
                </Col>
                <Col style={{ textAlign: 'right' }}>
                  <Title level={4} style={{ margin: 0 }}>HÓA ĐƠN THANH TOÁN</Title>
                  <Text strong>Mã Booking: {currentInvoice.bookingCode}</Text>
                  <div style={{ marginTop: 6 }}>
                    {currentInvoice.status === 'Paid' || currentInvoice.status === 'Đã thanh toán'
                      ? <Tag color="green" style={{ fontSize: 13, padding: '2px 8px' }}>✅ ĐÃ THANH TOÁN</Tag>
                      : currentInvoice.status === 'Cancelled' || currentInvoice.status === 'Đã hủy'
                        ? <Tag color="red" style={{ fontSize: 13, padding: '2px 8px' }}>❌ ĐÃ HỦY HÓA ĐƠN</Tag>
                        : <Tag color="orange" style={{ fontSize: 13, padding: '2px 8px' }}>⏳ CHỜ THANH TOÁN</Tag>
                    }
                  </div>
                </Col>
              </Row>

              <Divider />

              <div style={{ marginBottom: 20 }}>
                <Text strong>Khách hàng thanh toán: </Text>
                <Text>{currentInvoice.guestName}</Text>
              </div>

              <Title level={5}>I. Chi phí lưu trú phòng</Title>
              <Table scroll={{ x: 'max-content' }}
                columns={[
                  { title: 'Phòng', dataIndex: 'roomNumber', render: text => <b>P.{text}</b> },
                  { title: 'Số đêm', dataIndex: 'nights', align: 'center' },
                  { title: 'Đơn giá/đêm', dataIndex: 'pricePerNight', render: val => `${val?.toLocaleString()} đ` },
                  { title: 'Thành tiền', dataIndex: 'lineTotal', align: 'right', render: val => <b>{val?.toLocaleString()} đ</b> },
                ]}
                dataSource={currentInvoice.roomDetails}
                pagination={false}
                size="small"
                rowKey="roomNumber"
                bordered
                style={{ marginBottom: 20 }}
              />

              {currentInvoice.serviceDetails && currentInvoice.serviceDetails.length > 0 && (
                <>
                  <Title level={5}>II. Dịch vụ phát sinh</Title>
                  <Table scroll={{ x: 'max-content' }}
                    columns={[
                      { title: 'Tên dịch vụ', dataIndex: 'serviceName' },
                      { title: 'Số lượng', dataIndex: 'quantity', align: 'center' },
                      { title: 'Đơn giá', dataIndex: 'unitPrice', render: val => `${val?.toLocaleString()} đ` },
                      { title: 'Thành tiền', dataIndex: 'total', align: 'right', render: val => <b>{val?.toLocaleString()} đ</b> },
                    ]}
                    dataSource={currentInvoice.serviceDetails}
                    pagination={false}
                    size="small"
                    rowKey="serviceName"
                    bordered
                    style={{ marginBottom: 20 }}
                  />
                </>
              )}

              {currentInvoice.penaltyDetails && currentInvoice.penaltyDetails.length > 0 && (
                <>
                  <Title level={5} type="danger">III. Phí đền bù hư hại tài sản</Title>
                  <Table scroll={{ x: 'max-content' }}
                    columns={[
                      { title: 'Tên vật tư hỏng', dataIndex: 'itemName', render: text => <Text type="danger">{text}</Text> },
                      { title: 'Số lượng', dataIndex: 'quantity', align: 'center' },
                      { title: 'Phạt đền bù', dataIndex: 'penaltyAmount', align: 'right', render: val => <b style={{ color: '#f5222d' }}>{val?.toLocaleString()} đ</b> },
                    ]}
                    dataSource={currentInvoice.penaltyDetails}
                    pagination={false}
                    size="small"
                    rowKey="itemName"
                    bordered
                    style={{ marginBottom: 20 }}
                  />
                </>
              )}

              <Divider />

              <Row justify="space-between">
                <Col span={11} style={{ textAlign: 'center' }}>
                  <Card size="small" style={{ borderRadius: 8, background: '#fafafa' }}>
                    <Title level={5} style={{ margin: '0 0 10px' }}>Quét mã QR thanh toán động <QrcodeOutlined /></Title>
                    {qrLoading ? (
                      <div style={{ padding: '30px 0' }}><LoadingOutlined style={{ fontSize: 24 }} spin /></div>
                    ) : qrData ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                          <img src={qrData.qrImageUrl || qrData.qrDataUrl} alt="VietQR Pay" style={{ width: 160, height: 160, objectFit: 'contain' }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{qrData.bankName || qrData.provider} - {qrData.accountName}</Text>
                        <br />
                        <Text strong style={{ color: '#f5222d', fontSize: 15 }}>{qrData.amount?.toLocaleString()} đ</Text>
                      </div>
                    ) : (
                      <div style={{ padding: '20px 0', color: '#999' }}>Mã QR thanh toán tạm thời chưa được kết xuất.</div>
                    )}
                  </Card>
                </Col>

                <Col span={11}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Row justify="space-between">
                      <Text>Tổng tiền phòng:</Text>
                      <Text strong>{currentInvoice.totalRoomAmount?.toLocaleString()} đ</Text>
                    </Row>
                    {currentInvoice.discountAmount > 0 && (
                      <Row justify="space-between" style={{ color: '#52c41a' }}>
                        <Text style={{ color: '#52c41a' }}>Khuyến mãi (Voucher):</Text>
                        <Text strong style={{ color: '#52c41a' }}>- {currentInvoice.discountAmount?.toLocaleString()} đ</Text>
                      </Row>
                    )}
                    <Row justify="space-between">
                      <Text>Phí dịch vụ gọi:</Text>
                      <Text strong>{currentInvoice.totalServiceAmount?.toLocaleString()} đ</Text>
                    </Row>
                    {currentInvoice.totalPenaltyAmount > 0 && (
                      <Row justify="space-between" style={{ color: '#f5222d' }}>
                        <Text type="danger">Phí phạt đền bù:</Text>
                        <Text strong type="danger">{currentInvoice.totalPenaltyAmount?.toLocaleString()} đ</Text>
                      </Row>
                    )}
                    <Row justify="space-between">
                      <Text>Thuế VAT (8%):</Text>
                      <Text strong>{currentInvoice.taxAmount?.toLocaleString()} đ</Text>
                    </Row>
                    {currentInvoice.depositAmount > 0 && (
                      <Row justify="space-between" style={{ color: '#52c41a' }}>
                        <Text style={{ color: '#52c41a' }}>Đã thu cọc trước:</Text>
                        <Text strong style={{ color: '#52c41a' }}>- {currentInvoice.depositAmount?.toLocaleString()} đ</Text>
                      </Row>
                    )}
                    <Divider style={{ margin: '8px 0' }} />
                    <Row justify="space-between" align="middle">
                      <Title level={4} style={{ margin: 0, color: '#f5222d' }}>TỔNG CẦN THU:</Title>
                      <Title level={4} style={{ margin: 0, color: '#f5222d' }}>{currentInvoice.finalTotal?.toLocaleString()} đ</Title>
                    </Row>
                  </div>
                </Col>
              </Row>

              <div className="no-print-area" style={{ marginTop: 35, display: 'flex', justifyContent: 'center', gap: 12 }}>
                {currentInvoice.status !== 'Paid' && currentInvoice.status !== 'Đã thanh toán' && currentInvoice.status !== 'Cancelled' && currentInvoice.status !== 'Đã hủy' && (
                  <Button
                    size="large"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={handleConfirmPayment}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Xác nhận đã nhận đủ tiền
                  </Button>
                )}
                <Button size="large" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>In hóa đơn</Button>
                {currentInvoice.status !== 'Paid' && currentInvoice.status !== 'Đã thanh toán' && (
                  <Button size="large" danger icon={<RollbackOutlined />} onClick={handleCancelInvoice}>Hủy hóa đơn</Button>
                )}
                <Button size="large" onClick={() => setIsInvoiceModalOpen(false)}>Đóng lại</Button>
              </div>
            </div>
          )}
        </Spin>
      </Modal>

      {/* DRAWER ĐĂNG BÀI VIẾT (RECEIVER BLOG) */}
      <Drawer
        title={<span style={{ fontSize: 16 }}>{editingPost ? '✏️ Chỉnh Sửa Bài Viết Lễ Tân' : '📝 Soạn Bài Viết Mới'}</span>}
        size="80%"
        open={postDrawerOpen}
        onClose={() => setPostDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setPostDrawerOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" onClick={handleSavePost} loading={loadingPosts} style={{ minWidth: 120 }}>
              {editingPost ? 'Lưu bài viết' : 'Đăng tải ngay'}
            </Button>
          </div>
        }
        destroyOnHidden
      >
        <Row gutter={24}>
          <Col span={16}>
            <Form form={postForm} layout="vertical">
              <Form.Item label="Tiêu đề bài đăng" name="title" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bài viết!' }]}>
                <Input size="large" placeholder="Nhập tiêu đề..." />
              </Form.Item>
              <Form.Item label="Tóm tắt ngắn (excerpt)" name="excerpt">
                <Input.TextArea rows={2} placeholder="Nội dung tóm tắt hiển thị trên danh sách..." maxLength={500} showCount />
              </Form.Item>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>
                  Nội dung chi tiết bài viết <span style={{ color: '#ff4d4f' }}>*</span>
                  <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>— Hỗ trợ Markdown viết bài chuyên nghiệp</span>
                </div>
                <div data-color-mode="light">
                  <MDEditor value={postContent} onChange={setPostContent} height={350} preview="live" visibleDragbar={false} />
                </div>
              </div>
            </Form>
          </Col>

          <Col span={8}>
            <Card title="⚡ Xuất bản & Tin Hot" size="small" style={{ borderRadius: 8, marginBottom: 16 }}>
              <Form form={postForm} layout="vertical">
                <Form.Item name="isPublished" valuePropName="checked" style={{ marginBottom: 12 }}>
                  <Switch checkedChildren="Cho phép hiển thị" unCheckedChildren="Ẩn khỏi trang" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="isHot" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Switch checkedChildren="Đặt Tin Hot (Đẩy lên đầu)" unCheckedChildren="Tin bài thường" style={{ width: '100%' }} />
                </Form.Item>
              </Form>
            </Card>

            <Card title="📍 Phân loại danh mục" size="small" style={{ borderRadius: 8, marginBottom: 16 }}>
              <Form form={postForm} layout="vertical">
                <Form.Item label="Danh mục bài viết" name="categoryId" rules={[{ required: true, message: 'Vui lòng chọn danh mục bài viết!' }]}>
                  <Select placeholder="-- Chọn danh mục bài viết --">
                    {categories.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item label="Liên kết loại phòng (nếu có)" name="roomTypeId" style={{ marginTop: 12 }}>
                  <Select placeholder="🌐 Đăng lên Trang Tin Tức (Mặc định)" allowClear>
                    {roomTypes.map(rt => <Option key={rt.id} value={rt.id}>🏨 {rt.name}</Option>)}
                  </Select>
                </Form.Item>
              </Form>
            </Card>

            <Card title="🖼️ Ảnh bìa bài viết" size="small" style={{ borderRadius: 8, marginBottom: 16 }}>
              <Form form={postForm} layout="vertical">
                <Spin spinning={uploadingImg}>
                  <Upload.Dragger
                    name="file"
                    accept="image/*"
                    showUploadList={false}
                    customRequest={handleUploadImage}
                    style={{ borderRadius: 6, marginBottom: 12 }}
                  >
                    {previewImg ? (
                      <img src={previewImg} alt="Cover Preview" style={{ width: '100%', maxHeight: 130, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <div style={{ padding: '12px 0' }}>
                        <p style={{ fontSize: 24, margin: 0 }}>📁</p>
                        <p style={{ margin: '6px 0 0', fontSize: 12 }}>Nhấp để chọn ảnh bìa</p>
                      </div>
                    )}
                  </Upload.Dragger>
                </Spin>
                {previewImg && (
                  <Button size="small" danger block onClick={() => { setPreviewImg(''); postForm.setFieldValue('imageUrl', ''); }}>
                    Xóa ảnh bìa
                  </Button>
                )}
                <Form.Item name="imageUrl" style={{ display: 'none' }}><Input /></Form.Item>
              </Form>
            </Card>

            <Card title="📎 Tải ảnh chèn vào bài viết" size="small" style={{ borderRadius: 8 }}>
              <Spin spinning={uploadingContentImg}>
                <Upload.Dragger
                  name="file"
                  accept="image/*"
                  showUploadList={false}
                  customRequest={handleUploadContentImage}
                  style={{ borderRadius: 6 }}
                >
                  <div style={{ padding: '12px 0' }}>
                    <p style={{ fontSize: 20, margin: 0 }}>📷</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>Tải chèn tự động vào bài viết</p>
                  </div>
                </Upload.Dragger>
              </Spin>
              <div style={{ marginTop: 8, fontSize: 10, color: '#888', textAlign: 'center' }}>
                💡 Ảnh tải lên sẽ tự động chèn cú pháp ảnh Markdown vào cuối trình soạn thảo.
              </div>
            </Card>
          </Col>
        </Row>
      </Drawer>

      {/* MODAL KIỂM TRA ĐỒ ĐẠC / VẬT TƯ PHÒNG */}
      <Modal
        title={`Kiểm tra tài sản & Xác nhận dọn dẹp - Phòng P.${selectedRoomForInventory?.roomNumber}`}
        open={isInventoryModalOpen}
        onCancel={() => setIsInventoryModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsInventoryModalOpen(false)}>Quay lại</Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!inventoryConfirmed}
            onClick={() => handleCompleteRoomCleaning(selectedRoomForInventory.id)}
            style={{
              backgroundColor: inventoryConfirmed ? '#52c41a' : undefined,
              borderColor: inventoryConfirmed ? '#52c41a' : undefined,
              color: inventoryConfirmed ? '#fff' : undefined
            }}
          >
            Hoàn tất kiểm tra & Xác nhận sạch sẽ
          </Button>
        ]}
        width={700}
        destroyOnHidden
      >
        <Spin spinning={inventoryLoading}>
          <div style={{ marginBottom: 16 }}>
            {selectedRoomForInventory?.status === 'Pending Check-out' ? (
              <Alert
                message={<span style={{ fontWeight: 'bold', color: '#c45100' }}>⚠️ PHÒNG ĐANG CHỜ KIỂM TRA CHECK-OUT</span>}
                description="Khách đang làm thủ tục trả phòng! Vui lòng đối chiếu thật kỹ danh sách vật tư bên dưới. Nhấp 'Báo hỏng / Mất' ngay nếu phát hiện hao hụt để hệ thống tự động tính phụ thu đền bù vào hóa đơn của khách."
                type="warning"
                showIcon
                style={{ borderRadius: 8 }}
              />
            ) : (
              <Alert
                message="Dọn dẹp định kỳ & Kiểm kê vật tư"
                description="Vui lòng đối chiếu kỹ danh sách tài sản phòng để đảm bảo buồng phòng sạch sẽ và đầy đủ thiết bị."
                type="info"
                showIcon
                style={{ borderRadius: 8 }}
              />
            )}
          </div>

          <Table scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Tên Vật Tư',
                key: 'amenityName',
                render: (_, record) => (
                  <Space>
                    {record.isActive ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <WarningOutlined style={{ color: '#ff4d4f' }} />}
                    <b style={{ color: record.isActive ? '#262626' : '#8c8c8c', textDecoration: record.isActive ? 'none' : 'line-through' }}>
                      {record.amenity?.name}
                    </b>
                  </Space>
                )
              },
              {
                title: 'Số lượng',
                dataIndex: 'quantity',
                key: 'quantity',
                align: 'center',
                render: (qty) => <Tag color="blue">{qty}</Tag>
              },
              {
                title: 'Thao tác Kiểm tra',
                key: 'action',
                align: 'center',
                render: (_, record) => {
                  const isDamaged = !record.isActive;
                  return (
                    <Button
                      size="small"
                      type="primary"
                      danger
                      disabled={isDamaged}
                      onClick={() => handleReportInventoryDamage(record, selectedRoomForInventory)}
                    >
                      {isDamaged ? 'Đã báo hỏng/mất' : 'Báo hỏng / Mất'}
                    </Button>
                  );
                }
              }
            ]}
            dataSource={roomInventory}
            rowKey="id"
            pagination={false}
            bordered
            size="small"
          />

          <div style={{ marginTop: 20, padding: '16px', backgroundColor: '#f6ffed', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
            <Checkbox
              checked={inventoryConfirmed}
              onChange={(e) => setInventoryConfirmed(e.target.checked)}
            >
              <span style={{ fontWeight: '600', color: '#389e0d', fontSize: '13px' }}>
                Tôi xác nhận đã kiểm kê phòng, tài sản đầy đủ và phòng đã sẵn sàng phục vụ sạch sẽ.
              </span>
            </Checkbox>
          </div>
        </Spin>
      </Modal>

      <style>{`.w-md-editor{border-radius:6px!important}.w-md-editor-toolbar{border-radius:6px 6px 0 0!important}`}</style>
    </div>
  );
};

export default ReceptionistDashboard;