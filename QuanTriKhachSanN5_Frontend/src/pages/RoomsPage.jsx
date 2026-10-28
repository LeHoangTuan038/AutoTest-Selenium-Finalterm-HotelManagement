// ==================================================================================
// TRANG DANH SÁCH PHÒNG (ROOMS LISTING) - THIẾT KẾ THEO MẪU 5 SAO
// Chú thích: Trang này bao gồm bộ lọc bên trái và danh sách phòng bên phải.
// ==================================================================================
import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Row, Col, Card, Button, Space, 
  Tag, Spin, Divider, Slider, Checkbox, message, 
  Avatar, Dropdown, DatePicker, InputNumber, Modal, Form, Input
} from 'antd';
import { 
  ArrowRightOutlined, UserOutlined, LogoutOutlined, 
  HomeOutlined, AppstoreOutlined, KeyOutlined, StarOutlined, 
  CoffeeOutlined, CarOutlined, GiftOutlined, SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs'; // THÊM DAYJS ĐỂ XỬ LÝ NGÀY THÁNG
import { getUserRoles } from "../utils/auth";

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const COLORS = {
  gold: "#c19b4a",
  dark: "#1a1a1a",
  gray: "#8c8c8c",
  lightBg: "#f8f9fa",
  white: "#ffffff",
  border: "#eeeeee"
};

const RoomsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = window.innerWidth <= 768;

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- STATE ĐẶT PHÒNG NHANH (QUICK BOOKING) ---
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [bookingDates, setBookingDates] = useState([dayjs(), dayjs().add(1, 'day')]);
  const [bookingAdults, setBookingAdults] = useState(2);
  const [bookingChildren, setBookingChildren] = useState(0);
  const [searchingState, setSearchingState] = useState('idle'); // 'idle' | 'searching' | 'success' | 'no-rooms'
  const [bookingLoading, setBookingLoading] = useState(false);
  const [createdBookingCode, setCreatedBookingCode] = useState('');
  const [quickVoucherCode, setQuickVoucherCode] = useState('');
  const [depositPaymentData, setDepositPaymentData] = useState(null);

  // --- STATE BỘ LỌC ---
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // 1. Kiểm tra đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // 2. Lấy dữ liệu phòng ban đầu
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchRooms = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/RoomTypes/public`);
        setAllRooms(response.data);
        
        // Lấy thông tin từ URL nếu có
        const adults = parseInt(searchParams.get('adults')) || 2;
        const children = parseInt(searchParams.get('children')) || 0;
        
        // Lọc sơ bộ theo sức chứa ngay khi tải trang
        const initialFiltered = response.data.filter(room => {
          return (room.capacityAdults >= adults) && (room.capacityChildren >= children);
        });
        
        setFilteredRooms(initialFiltered);
      } catch (error) {
        console.error("Lỗi tải phòng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  // 3. Tự động kích hoạt bảng đặt phòng nhanh từ trang chủ nếu có query param
  useEffect(() => {
    if (allRooms.length === 0) return;
    
    const quickRoomName = searchParams.get('quickBookRoomName');
    if (quickRoomName) {
      const decodedName = decodeURIComponent(quickRoomName).toLowerCase().trim();
      const matched = allRooms.find(r => 
        r.name.toLowerCase().trim() === decodedName
      );
      
      if (matched) {
        // KIỂM TRA QUYỀN TRƯỚC KHI TỰ ĐỘNG ĐẶT PHÒNG
        const token = localStorage.getItem('token');
        const roles = getUserRoles();
        if (!token) {
          message.warning('Vui lòng đăng nhập với tài khoản Khách hàng (Guest) để thực hiện đặt phòng trực tuyến.');
          navigate('/login');
          return;
        }
        if (!roles.includes('Guest')) {
          message.error('Chỉ tài khoản Khách hàng (Guest) mới có thể thực hiện đặt phòng trực tuyến.');
          return;
        }

        setSelectedRoomForBooking(matched);
        setSearchingState('idle');
        setBookingModalVisible(true);

        // Xóa query param để tránh lặp lại khi refresh trang
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete('quickBookRoomName');
        const newSearch = newParams.toString();
        navigate({
          search: newSearch ? `?${newSearch}` : ''
        }, { replace: true });
      }
    }
  }, [allRooms, searchParams]);

  // ==================================================================================
  // 3. LOGIC BỘ LỌC THỜI GIAN THỰC (REAL-TIME FILTERING)
  // Chú thích: Hàm này chạy mỗi khi người dùng thay đổi Giá, Loại phòng hoặc Tiện ích
  // ==================================================================================
  useEffect(() => {
    if (allRooms.length === 0) return;

    const adults = parseInt(searchParams.get('adults')) || 1;
    const children = parseInt(searchParams.get('children')) || 0;

    const result = allRooms.filter(room => {
      // a. Lọc theo Khoảng Giá
      const matchesPrice = room.basePrice >= priceRange[0] && room.basePrice <= priceRange[1];
      
      // b. Lọc theo Loại Phòng
      const matchesType = selectedTypes.length === 0 || selectedTypes.some(type => room.name.toLowerCase().includes(type.toLowerCase()));
      
      // c. Lọc theo Sức Chứa (Từ URL)
      const matchesCapacity = (room.capacityAdults >= adults) && (room.capacityChildren >= children);

      // d. Lọc theo Tiện nghi (Amenities) - Tối ưu hóa độ chính xác
      let matchesAmenities = true;
      if (selectedAmenities.length > 0) {
        const roomText = `${room.name} ${room.description} ${room.amenities || ''}`.toLowerCase();
        matchesAmenities = selectedAmenities.every(amenity => {
          if (amenity === 'wifi') return roomText.includes('wifi');
          if (amenity === 'tv') return roomText.includes('tv');
          if (amenity === 'minibar') return roomText.includes('minibar');
          if (amenity === 'bath') return roomText.includes('bồn tắm') || roomText.includes('bath') || roomText.includes('két');
          if (amenity === 'air') return roomText.includes('điều hòa') || roomText.includes('air') || roomText.includes('lạnh');
          return true;
        });
      }

      return matchesPrice && matchesType && matchesCapacity && matchesAmenities;
    });

    setFilteredRooms(result);
  }, [priceRange, selectedTypes, selectedAmenities, allRooms, searchParams]);

  const handleQuickBookConfirm = async () => {
    if (!bookingDates || bookingDates.length !== 2) {
      message.error("Vui lòng chọn thời gian nhận / trả phòng!");
      return;
    }

    setSearchingState('searching');
    setBookingLoading(true);

    try {
      // 1. Giả lập hiệu ứng tìm phòng 1.8 giây cực kỳ trực quan, cao cấp
      await new Promise(resolve => setTimeout(resolve, 1800));

      const [checkIn, checkOut] = bookingDates;

      // 2. Gọi API kiểm tra phòng trống của toàn hệ thống
      const searchPayload = {
        checkIn: checkIn.format("YYYY-MM-DDTHH:mm:ss"),
        checkOut: checkOut.format("YYYY-MM-DDTHH:mm:ss"),
        adults: bookingAdults,
        children: bookingChildren
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/Bookings/available-rooms`, searchPayload);

      // Tìm loại phòng khớp với phòng hiện tại
      const matchedType = response.data.find(t => 
        t.roomTypeName.toLowerCase().trim() === selectedRoomForBooking.roomType?.name?.toLowerCase().trim() ||
        t.roomTypeName.toLowerCase().trim() === selectedRoomForBooking.name?.toLowerCase().trim()
      );

      // Nếu không có phòng hoặc danh sách phòng trống rỗng
      if (!matchedType || !matchedType.availableRooms || matchedType.availableRooms.length === 0) {
        setSearchingState('no-rooms');
        return;
      }

      // 3. Nếu còn phòng trống, thực hiện tính toán chi phí và áp dụng mã giảm giá
      const selectedRoomId = matchedType.availableRooms[0].id;
      const numNights = checkOut.diff(checkIn, 'day') || 1;
      const originalTotalPrice = matchedType.pricePerNight * numNights;
      let discount = 0;
      let voucherId = null;
      let voucherCodeApplied = '';

      const token = localStorage.getItem('token');

      // Kiểm tra voucher
      if (quickVoucherCode && quickVoucherCode.trim()) {
        try {
          const codeUpper = quickVoucherCode.trim().toUpperCase();
          const vResp = await axios.get(
            `${import.meta.env.VITE_API_URL}/Vouchers/check/${codeUpper}?totalPrice=${originalTotalPrice}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (vResp.status === 200 && vResp.data) {
            const voucher = vResp.data;
            voucherId = voucher.id;
            voucherCodeApplied = voucher.code;

            if (voucher.discountType === "PERCENT") {
              discount = originalTotalPrice * (voucher.discountValue / 100);
            } else {
              discount = voucher.discountValue;
            }

            if (discount > originalTotalPrice) {
              discount = originalTotalPrice;
            }
            message.success(`Áp dụng mã giảm giá ${voucher.code} thành công!`);
          }
        } catch (vErr) {
          console.error("Lỗi áp dụng voucher:", vErr);
          message.warning(vErr.response?.data?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn!");
        }
      }

      const finalTotalPrice = originalTotalPrice - discount;
      const depositAmount = finalTotalPrice * 0.3; // 30% Đặt cọc

      setDepositPaymentData({
        selectedRoomId,
        numNights,
        originalTotalPrice,
        discount,
        finalTotalPrice,
        depositAmount,
        voucherId,
        voucherCodeApplied,
        pricePerNight: matchedType.pricePerNight,
        availableRooms: matchedType.availableRooms
      });

      setSearchingState('deposit');
    } catch (error) {
      console.error("Lỗi đặt phòng nhanh:", error);
      setSearchingState('no-rooms');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleQuickBookFinalPay = async () => {
    if (!depositPaymentData) return;
    setBookingLoading(true);
    setSearchingState('searching');

    try {
      const [checkIn, checkOut] = bookingDates;
      const token = localStorage.getItem('token');
      const createPayload = {
        guestName: currentUser?.fullName || currentUser?.userName || "Khách hàng",
        guestPhone: currentUser?.phone || "0901234567",
        guestEmail: currentUser?.email || "guest@hotel.com",
        checkIn: checkIn.format('YYYY-MM-DDTHH:mm:ss'),
        checkOut: checkOut.format('YYYY-MM-DDTHH:mm:ss'),
        selectedRoomIds: [depositPaymentData.selectedRoomId],
        userId: currentUser?.id,
        depositAmount: depositPaymentData.depositAmount,
        voucherId: depositPaymentData.voucherId
      };

      const createResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/Bookings/create`,
        createPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (createResponse.status === 200 || createResponse.status === 201) {
        setCreatedBookingCode(createResponse.data.bookingCode || 'BK-' + Math.floor(Math.random() * 1000000));
        setSearchingState('success');
      } else {
        setSearchingState('no-rooms');
      }
    } catch (error) {
      console.error("Lỗi xác nhận đặt phòng:", error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn đặt phòng.");
      setSearchingState('no-rooms');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ', icon: <UserOutlined />, onClick: () => navigate('/guest/profile') },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout }
  ];

  return (
    <Layout style={{ background: COLORS.lightBg, minHeight: '100vh' }}>
      
      {/* === HEADER: LUXURY LIGHT THEME === */}
      <Header style={{ 
        background: COLORS.white, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '0 20px' : '0 80px', height: '80px', borderBottom: `1px solid ${COLORS.border}`,
        position: 'sticky', top: 0, zIndex: 1000,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/homepage')}>
          <Title level={3} style={{ margin: 0, fontFamily: "'Noto Serif', serif", letterSpacing: '2px', color: COLORS.dark }}>IT HOTEL</Title>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: '40px' }}>
            {[
              { label: 'Trang chủ', path: '/homepage' },
              { label: 'Phòng nghỉ', path: '/rooms' },
              { label: 'Giới thiệu', path: '/about' },
              { label: 'Liên hệ', path: '/contact' }
            ].map((item, idx) => {
              const isActive = window.location.pathname === item.path;
              return (
                <Text 
                  key={idx} 
                  style={{ 
                    cursor: 'pointer', fontWeight: 500, 
                    color: isActive ? COLORS.gold : COLORS.dark,
                    fontSize: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Text>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          {isLoggedIn ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: 12, display: 'block', color: COLORS.dark }}>{currentUser?.fullName || 'Khách'}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.gray }}>
                    {getUserRoles().includes('Admin') ? 'QUẢN TRỊ' : (getUserRoles().includes('Receptionist') ? 'LỄ TÂN' : (getUserRoles().includes('Housekeeper') ? 'BUỒNG PHÒNG' : 'KHÁCH HÀNG'))}
                  </Text>
                </div>
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')} style={{ background: COLORS.dark, border: 'none', fontWeight: 'bold' }}>LOGIN</Button>
          )}
        </div>
      </Header>

      {/* === HERO SEARCH SECTION === */}
      <div style={{ 
        height: '350px', position: 'relative', overflow: 'hidden',
        backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop')",
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
        <div style={{ position: 'relative', textAlign: 'center', width: '100%', maxWidth: '1000px', padding: '0 20px' }}>
          <Text style={{ color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 4, fontWeight: 'bold', fontSize: 12 }}>TRẢI NGHIỆM ĐẲNG CẤP</Text>
          <Title level={1} style={{ color: '#fff', fontFamily: "'Noto Serif', serif", fontSize: 56, margin: '10px 0', textShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
            Chọn Phòng <span style={{ color: COLORS.gold }}>Của Bạn</span>
          </Title>
          <Text style={{ color: '#ddd' }}>6 loại phòng - Hà Nội</Text>

          {/* Search Bar Container: Đã căn giữa */}
          <div style={{ 
            marginTop: 40, background: '#fff', borderRadius: 12, padding: '10px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 15px 30px rgba(0,0,0,0.1)', width: '100%'
          }}>
            <div style={{ flex: 1, textAlign: 'left', padding: '0 15px' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.gray, display: 'block' }}>NHẬN PHÒNG</Text>
              <DatePicker 
                bordered={false} 
                placeholder="Chọn ngày"
                value={searchParams.get('checkIn') ? dayjs(searchParams.get('checkIn')) : null}
                onChange={(date) => {
                  if (date) {
                    searchParams.set('checkIn', date.format('YYYY-MM-DD'));
                    setSearchParams(searchParams);
                  }
                }}
                style={{ padding: 0, width: '100%' }}
              />
            </div>
            <Divider type="vertical" style={{ height: 40, background: '#eee' }} />
            <div style={{ flex: 1, textAlign: 'left', padding: '0 15px' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.gray, display: 'block' }}>TRẢ PHÒNG</Text>
              <DatePicker 
                bordered={false} 
                placeholder="Chọn ngày"
                value={searchParams.get('checkOut') ? dayjs(searchParams.get('checkOut')) : null}
                onChange={(date) => {
                  if (date) {
                    searchParams.set('checkOut', date.format('YYYY-MM-DD'));
                    setSearchParams(searchParams);
                  }
                }}
                style={{ padding: 0, width: '100%' }}
              />
            </div>
            <Divider type="vertical" style={{ height: 40, background: '#eee' }} />
            <div style={{ flex: 1, textAlign: 'left', padding: '0 15px' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.gray, display: 'block' }}>KHÁCH</Text>
              <Dropdown menu={{ 
                items: [1,2,3,4,5].map(n => ({ 
                  key: n, 
                  label: `${n} Người lớn`, 
                  onClick: () => {
                    searchParams.set('adults', n);
                    setSearchParams(searchParams);
                  }
                })) 
              }}>
                <div style={{ cursor: 'pointer', fontSize: 14, color: COLORS.dark }}>
                  {searchParams.get('adults') || 2} Người lớn, {searchParams.get('children') || 0} Trẻ em
                </div>
              </Dropdown>
            </div>
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              style={{ width: 50, height: 50, borderRadius: 8, background: COLORS.gold, border: 'none' }} 
              onClick={() => message.success('Đã cập nhật tìm kiếm')}
            />
          </div>
        </div>
      </div>

      <Content style={{ padding: isMobile ? '40px 20px' : '60px 80px' }}>
        <Row gutter={[40, 40]}>
          
          {/* === SIDEBAR: BỘ LỌC (LIGHT THEME) === */}
          <Col xs={24} lg={6}>
            <Title level={4} style={{ fontFamily: "'Noto Serif', serif", marginBottom: 30, color: COLORS.dark }}>Bộ lọc</Title>
            
            <div style={{ 
              background: COLORS.white, padding: 30, borderRadius: 16, 
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 5px 15px rgba(0,0,0,0.03)'
            }}>
              {/* Khoảng giá */}
              <div style={{ marginBottom: 40 }}>
                <Text strong style={{ fontSize: 11, color: COLORS.gray, textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>KHOẢNG GIÁ / ĐÊM</Text>
                <Slider 
                  range 
                  min={0} max={10000000} step={500000}
                  value={priceRange}
                  onChange={(val) => setPriceRange(val)}
                  trackStyle={[{ background: COLORS.gold }]}
                  handleStyle={[{ border: `2px solid ${COLORS.gold}` }, { border: `2px solid ${COLORS.gold}` }]}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 15, alignItems: 'center' }}>
                  <InputNumber
                    min={0} max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(val) => setPriceRange([val, priceRange[1]])}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    style={{ flex: 1 }}
                  />
                  <Text style={{ color: COLORS.gray }}>-</Text>
                  <InputNumber
                    min={priceRange[0]} max={10000000}
                    value={priceRange[1]}
                    onChange={(val) => setPriceRange([priceRange[0], val])}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    style={{ flex: 1, fontWeight: 'bold', color: COLORS.gold }}
                  />
                </div>
              </div>

              {/* Loại phòng */}
              <div style={{ marginBottom: 40 }}>
                <Text strong style={{ fontSize: 11, color: COLORS.gray, textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>LOẠI PHÒNG</Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Standard', icon: <HomeOutlined /> },
                    { label: 'Deluxe', icon: <AppstoreOutlined /> },
                    { label: 'Suite', icon: <KeyOutlined /> },
                    { label: 'Executive', icon: <StarOutlined /> }
                  ].map((type, i) => {
                    const isSelected = selectedTypes.includes(type.label);
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          if (isSelected) setSelectedTypes(selectedTypes.filter(t => t !== type.label));
                          else setSelectedTypes([...selectedTypes, type.label]);
                        }}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 15, padding: '12px 15px', 
                          background: isSelected ? 'rgba(193,155,74,0.05)' : 'transparent', 
                          borderRadius: 8, cursor: 'pointer',
                          border: isSelected ? `1px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
                          transition: 'all 0.3s'
                        }}
                      >
                        <div style={{ width: 32, height: 32, background: COLORS.white, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLORS.border}`, color: isSelected ? COLORS.gold : COLORS.gray }}>
                          {type.icon}
                        </div>
                        <div style={{ lineHeight: 1 }}>
                          <Text strong style={{ fontSize: 13, display: 'block', color: isSelected ? COLORS.gold : COLORS.dark }}>{type.label}</Text>
                          <Text style={{ fontSize: 10, color: COLORS.gray }}>Sang trọng, đẳng cấp</Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tiện ích */}
              <div style={{ marginBottom: 40 }}>
                <Text strong style={{ fontSize: 11, color: COLORS.gray, textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>TIỆN ÍCH</Text>
                <Checkbox.Group 
                  style={{ width: '100%' }}
                  onChange={(checkedValues) => setSelectedAmenities(checkedValues)}
                  value={selectedAmenities}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Checkbox value="wifi"><CoffeeOutlined style={{ marginRight: 8 }} /> Wifi miễn phí</Checkbox>
                    <Checkbox value="tv"><AppstoreOutlined style={{ marginRight: 8 }} /> TV</Checkbox>
                    <Checkbox value="minibar"><GiftOutlined style={{ marginRight: 8 }} /> Minibar</Checkbox>
                    <Checkbox value="bath"><StarOutlined style={{ marginRight: 8 }} /> Bồn tắm / Két</Checkbox>
                    <Checkbox value="air"><CarOutlined style={{ marginRight: 8 }} /> Điều hòa</Checkbox>
                  </div>
                </Checkbox.Group>
              </div>

              {/* Box ưu đãi */}
              <div style={{ background: '#fff9e6', padding: 20, borderRadius: 12, border: '1px solid #ffe58f' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <GiftOutlined style={{ color: COLORS.gold, fontSize: 18 }} />
                  <div>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>Ưu đãi thành viên</Text>
                    <Text style={{ fontSize: 11, color: COLORS.gray }}>Đăng nhập để nhận ngay ưu đãi 10% khi đặt phòng.</Text>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* === DANH SÁCH PHÒNG (LIGHT THEME) === */}
          <Col xs={24} lg={18}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
              <Title level={3} style={{ margin: 0, fontFamily: "'Noto Serif', serif", color: COLORS.dark }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: COLORS.gold }}>{filteredRooms.length}</span> phòng có sẵn
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: COLORS.gray, fontSize: 12 }}>Sắp xếp:</Text>
                <Dropdown menu={{ items: [{ key: '1', label: 'Phổ biến nhất' }] }}>
                  <Button style={{ borderRadius: 8 }}>Phổ biến nhất</Button>
                </Dropdown>
              </div>
            </div>

            {loading ? (
              <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
            ) : filteredRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <HomeOutlined style={{ fontSize: 48, color: COLORS.gray, marginBottom: 20 }} />
                <Title level={4} style={{ color: COLORS.gray }}>Không tìm thấy phòng phù hợp</Title>
                <Button onClick={() => { setPriceRange([0, 10000000]); setSelectedTypes([]); setSelectedAmenities([]); }}>Xóa bộ lọc</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                {filteredRooms.map((room, idx) => (
                  <motion.div 
                    key={room.id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card 
                      bodyStyle={{ padding: 0 }} 
                      style={{ 
                        borderRadius: 16, overflow: 'hidden', 
                        background: COLORS.white, // PHỤC HỒI NỀN TRẮNG
                        border: `1px solid ${COLORS.border}`,
                        boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Row>
                        {/* Ảnh bên trái */}
                        <Col xs={24} md={10} style={{ position: 'relative' }}>
                          <img 
                            src={room.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000"} 
                            alt={room.name} style={{ width: '100%', height: '100%', minHeight: '300px', objectFit: 'cover' }} 
                          />
                          <div style={{ position: 'absolute', top: 15, left: 15, display: 'flex', gap: 8 }}>
                            {room.discount && <Tag color="gold" style={{ borderRadius: 4, fontWeight: 'bold' }}>-{room.discount}%</Tag>}
                            <Tag color="black" style={{ borderRadius: 4, fontWeight: 'bold' }}>PHỔ BIẾN</Tag>
                          </div>
                        </Col>

                        {/* Nội dung bên phải */}
                        <Col xs={24} md={14} style={{ padding: 30 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong style={{ color: COLORS.gold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                              {room.roomType?.name || 'DELUXE ROOM'}
                            </Text>
                            <Text style={{ color: COLORS.gold, fontSize: 12 }}><StarOutlined /> 4.9 <span style={{ color: COLORS.gray }}>(128)</span></Text>
                          </div>
                          
                          <Title level={3} 
                            onClick={() => navigate(`/room/${room.id}`)}
                            style={{ 
                              fontFamily: "'Noto Serif', serif", color: COLORS.dark, 
                              margin: '10px 0 15px', fontSize: 26, cursor: 'pointer'
                            }}
                          >
                            {room.name}
                          </Title>
                          <Paragraph style={{ color: COLORS.gray, fontSize: 14, minHeight: 42 }}>
                            {room.description || "Phòng sang trọng với thiết kế hiện đại, view thành phố tuyệt đẹp mang lại trải nghiệm nghỉ dưỡng hoàn hảo."}
                          </Paragraph>
                          
                          <Space size={20} style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 12, color: COLORS.gray }}><AppstoreOutlined /> {room.sizeSqm || 32} m²</Text>
                            <Text style={{ fontSize: 12, color: COLORS.gray }}><UserOutlined /> Tối đa {room.capacityAdults} khách</Text>
                          </Space>

                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 30 }}>
                            {(room.amenities || 'Wifi, TV, Minibar, Điều hòa').split(',').map(tag => (
                              <Tag key={tag} style={{ borderRadius: 4, background: '#f5f5f5', border: 'none', color: COLORS.gray, padding: '2px 12px' }}>{tag.trim()}</Tag>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px solid ${COLORS.border}`, paddingTop: 20 }}>
                            <div>
                              <Text delete style={{ color: COLORS.gray, fontSize: 12, display: 'block' }}>
                                {new Intl.NumberFormat('vi-VN').format(room.basePrice * 1.2)}đ
                              </Text>
                              <Title level={2} style={{ margin: 0, color: COLORS.gold, fontSize: 32 }}>
                                {new Intl.NumberFormat('vi-VN').format(room.basePrice)}đ <span style={{ fontSize: 14, color: COLORS.gray, fontWeight: 400 }}>/ đêm</span>
                              </Title>
                            </div>
                            <Space>
                              <Button 
                                onClick={() => navigate(`/room/${room.id}`)}
                                style={{ 
                                  borderRadius: 8, height: 48, padding: '0 25px', 
                                  border: `2px solid ${COLORS.gold}`, color: COLORS.gold,
                                  fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12,
                                  letterSpacing: 1
                                }}
                              >
                                Xem chi tiết
                              </Button>
                              <Button 
                                type="primary"
                                onClick={() => {
                                  // KIỂM TRA QUYỀN TRƯỚC KHI ĐẶT PHÒNG
                                  const roles = getUserRoles();
                                  if (!isLoggedIn) {
                                    message.warning('Vui lòng đăng nhập để thực hiện đặt phòng.');
                                    navigate('/login');
                                    return;
                                  }
                                  
                                  // CHỈ QUYỀN GUEST MỚI ĐƯỢC ĐẶT PHÒNG (ĐỒNG BỘ VỚI HỆ THỐNG)
                                  if (!roles.includes('Guest')) {
                                    message.error('Chỉ tài khoản Khách hàng (Guest) mới có thể thực hiện đặt phòng trực tuyến.');
                                    return;
                                  }

                                  setSelectedRoomForBooking(room);
                                  setSearchingState('idle');
                                  setBookingModalVisible(true);
                                }}
                                style={{ 
                                  background: COLORS.dark, color: '#fff', border: 'none', 
                                  borderRadius: 8, height: 48, padding: '0 30px', fontWeight: 'bold' 
                                }}
                              >
                                Đặt ngay <ArrowRightOutlined />
                              </Button>
                            </Space>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </Col>
        </Row>
      </Content>
      
      {/* Footer Info Box (Mẫu cuối ảnh) */}
      <div style={{ background: COLORS.white, padding: '40px 80px', borderTop: `1px solid ${COLORS.border}` }}>
        <Row gutter={[20, 20]}>
          {[
            { label: 'Đặt phòng an toàn', sub: 'Thanh toán được mã hóa', icon: <StarOutlined /> },
            { label: 'Xác nhận tức thì', sub: 'Nhận email ngay lập tức', icon: <LogoutOutlined /> },
            { label: 'Hỗ trợ 24/7', sub: 'Luôn sẵn sàng hỗ trợ', icon: <CarOutlined /> }
          ].map((item, i) => (
            <Col xs={24} md={8} key={i}>
              <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                <div style={{ color: COLORS.gold, fontSize: 24 }}>{item.icon}</div>
                <div>
                  <Text strong style={{ fontSize: 13, display: 'block' }}>{item.label}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.gray }}>{item.sub}</Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ========================================== */}
      {/* MODAL ĐẶT PHÒNG NHANH - CỰC KỲ CAO CẤP */}
      {/* ========================================== */}
      <Modal
        open={bookingModalVisible}
        onCancel={() => {
          if (!bookingLoading) {
            setBookingModalVisible(false);
            setSearchingState('idle');
          }
        }}
        footer={null}
        width={550}
        centered
        destroyOnClose
        title={null}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ borderRadius: 16, overflow: 'hidden' }}>
          
          {/* HEADER MODAL */}
          <div style={{ 
            background: COLORS.dark, padding: '24px 30px', color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <Text style={{ color: COLORS.gold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 'bold', display: 'block' }}>Hệ thống đặt phòng trực tuyến</Text>
              <Title level={3} style={{ margin: '4px 0 0', color: '#fff', fontFamily: "'Noto Serif', serif" }}>Đặt phòng nhanh</Title>
            </div>
            <HomeOutlined style={{ fontSize: 32, color: COLORS.gold }} />
          </div>

          {/* NỘI DUNG CHÍNH */}
          <div style={{ padding: '30px', background: '#fff' }}>
            
            {/* 1. TRẠNG THÁI NHẬP THÔNG TIN (IDLE) */}
            {searchingState === 'idle' && (
              <Form layout="vertical" onFinish={handleQuickBookConfirm}>
                <div style={{ marginBottom: 20, padding: '12px 16px', background: '#fcf8e3', border: '1px solid #faebcc', borderRadius: 8 }}>
                  <Text strong style={{ fontSize: 13, color: '#8a6d3b', display: 'block' }}>Loại phòng được chọn:</Text>
                  <Text strong style={{ fontSize: 16, color: COLORS.dark }}>{selectedRoomForBooking?.name}</Text>
                  <Text style={{ display: 'block', fontSize: 12, color: COLORS.gray }}>
                    Đơn giá: <strong style={{ color: COLORS.gold }}>{selectedRoomForBooking ? new Intl.NumberFormat('vi-VN').format(selectedRoomForBooking.basePrice) : 0}đ</strong> / đêm
                  </Text>
                </div>

                <Form.Item label={<Text strong style={{ fontSize: 13 }}>Thời gian lưu trú (Nhận / Trả phòng)</Text>} required>
                  <DatePicker.RangePicker 
                    style={{ width: '100%', height: 48, borderRadius: 8 }} 
                    format="DD/MM/YYYY"
                    value={bookingDates}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    onChange={(dates) => setBookingDates(dates)}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text strong style={{ fontSize: 13 }}>Người lớn</Text>} required>
                      <InputNumber 
                        min={1} max={10} 
                        style={{ width: '100%', height: 48, borderRadius: 8, display: 'flex', alignItems: 'center' }} 
                        value={bookingAdults}
                        onChange={(val) => setBookingAdults(val || 1)}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text strong style={{ fontSize: 13 }}>Trẻ em</Text>}>
                      <InputNumber 
                        min={0} max={10} 
                        style={{ width: '100%', height: 48, borderRadius: 8, display: 'flex', alignItems: 'center' }} 
                        value={bookingChildren}
                        onChange={(val) => setBookingChildren(val || 0)}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Ô NHẬP MÃ GIẢM GIÁ */}
                <Form.Item label={<Text strong style={{ fontSize: 13 }}>Mã giảm giá (Nếu có)</Text>}>
                  <Input 
                    placeholder="Nhập mã voucher (ví dụ: SINHNHAT25, VOUCHER10...)" 
                    style={{ height: 48, borderRadius: 8 }}
                    value={quickVoucherCode}
                    onChange={(e) => setQuickVoucherCode(e.target.value)}
                  />
                </Form.Item>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <Button 
                    style={{ flex: 1, height: 48, borderRadius: 8, fontWeight: 'bold' }}
                    onClick={() => setBookingModalVisible(false)}
                  >
                    HỦY BỎ
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    style={{ flex: 2, height: 48, borderRadius: 8, background: COLORS.gold, border: 'none', fontWeight: 'bold' }}
                  >
                    XÁC NHẬN ĐẶT PHÒNG
                  </Button>
                </div>
              </Form>
            )}

            {/* 2. TRẠNG THÁI ĐANG TÌM PHÒNG (SEARCHING) */}
            {searchingState === 'searching' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
                <Title level={4} style={{ marginTop: 24, color: COLORS.dark }}>Đang tìm phòng trống...</Title>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Hệ thống đang quét thời gian thực trạng thái khả dụng của loại phòng <strong>{selectedRoomForBooking?.name}</strong>...
                </Text>
                <div style={{ 
                  marginTop: 20, width: '100%', height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', background: COLORS.gold, width: '70%',
                    animation: 'searching-bar 2s infinite linear' 
                  }} />
                </div>
                <style>{`
                  @keyframes searching-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(150%); }
                  }
                `}</style>
              </div>
            )}

            {/* 2.5. TRẠNG THÁI HIỂN THỊ ĐẶT CỌC & QUÉT MÃ VIETQR (DEPOSIT) */}
            {searchingState === 'deposit' && depositPaymentData && (
              <div style={{ padding: '10px 0' }}>
                <Row gutter={20}>
                  <Col span={14}>
                    <div style={{ marginBottom: 15, padding: 12, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                      <Text strong style={{ fontSize: 13, color: COLORS.dark, display: 'block', marginBottom: 8 }}>Tóm tắt chi phí đặt phòng:</Text>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 12, color: COLORS.gray }}>Đơn giá phòng:</Text>
                        <Text style={{ fontSize: 12 }} strong>{new Intl.NumberFormat('vi-VN').format(depositPaymentData.pricePerNight)}đ / đêm</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 12, color: COLORS.gray }}>Số đêm lưu trú:</Text>
                        <Text style={{ fontSize: 12 }} strong>{depositPaymentData.numNights} đêm</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, borderTop: '1px dashed #eee', paddingTop: 6 }}>
                        <Text style={{ fontSize: 12, color: COLORS.gray }}>Tổng tiền phòng gốc:</Text>
                        <Text style={{ fontSize: 12 }} strong>{new Intl.NumberFormat('vi-VN').format(depositPaymentData.originalTotalPrice)}đ</Text>
                      </div>
                      {depositPaymentData.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#27ae60' }}>
                          <Text style={{ fontSize: 12 }}>Voucher giảm giá ({depositPaymentData.voucherCodeApplied}):</Text>
                          <Text style={{ fontSize: 12 }} strong>-{new Intl.NumberFormat('vi-VN').format(depositPaymentData.discount)}đ</Text>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ddd', paddingTop: 6, marginTop: 4 }}>
                        <Text style={{ fontSize: 13 }} strong>Tổng tiền sau giảm:</Text>
                        <Text style={{ fontSize: 13, color: COLORS.gold }} strong>{new Intl.NumberFormat('vi-VN').format(depositPaymentData.finalTotalPrice)}đ</Text>
                      </div>
                    </div>

                    <div style={{ padding: 15, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8 }}>
                      <Text type="danger" strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>SỐ TIỀN CẦN ĐẶT CỌC (30%):</Text>
                      <Title level={3} type="danger" style={{ margin: 0, fontWeight: 'bold' }}>
                        {new Intl.NumberFormat('vi-VN').format(depositPaymentData.depositAmount)}đ
                      </Title>
                    </div>
                  </Col>

                  <Col span={10} style={{ textAlign: 'center' }}>
                    <div style={{ padding: '12px', background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
                      <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 11, letterSpacing: 1 }}>QUÉT MÃ VIETQR</Text>
                      <div style={{ background: '#fafafa', padding: 6, borderRadius: 8, display: 'inline-block', border: '1px solid #f0f0f0', marginBottom: 8 }}>
                        <img 
                          src={`https://img.vietqr.io/image/970407-29363623939-compact.png?amount=${depositPaymentData.depositAmount}&addInfo=${encodeURIComponent(`Dat coc phong ${selectedRoomForBooking?.name}`)}&accountName=HOTEL%20IT%20CODE`} 
                          alt="VietQR Deposit" 
                          style={{ width: 145, height: 145, objectFit: 'contain' }} 
                        />
                      </div>
                      <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', display: 'block', color: COLORS.dark }}>Ngân hàng Techcombank</Text>
                        <Text style={{ fontSize: 10, display: 'block', color: COLORS.gray }}>Chủ TK: HOTEL IT CODE</Text>
                        <Text style={{ fontSize: 10, display: 'block', color: COLORS.gray }}>STK: 29363623939</Text>
                      </div>
                    </div>
                  </Col>
                </Row>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <Button 
                    style={{ flex: 1, height: 48, borderRadius: 8, fontWeight: 'bold' }}
                    onClick={() => {
                      setSearchingState('idle');
                    }}
                  >
                    QUAY LẠI
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={handleQuickBookFinalPay}
                    style={{ flex: 2, height: 48, borderRadius: 8, background: '#27ae60', borderColor: '#27ae60', fontWeight: 'bold' }}
                  >
                    ĐÃ CHUYỂN KHOẢN & ĐẶT
                  </Button>
                </div>
              </div>
            )}

            {/* 3. TRẠNG THÁI ĐẶT THÀNH CÔNG (SUCCESS) */}
            {searchingState === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ 
                  width: 72, height: 72, background: 'rgba(39, 174, 96, 0.1)', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', color: '#27ae60', fontSize: 36
                }}>
                  ✓
                </div>
                <Title level={3} style={{ color: '#27ae60', margin: 0 }}>ĐẶT PHÒNG THÀNH CÔNG!</Title>
                <Text style={{ display: 'block', marginTop: 10, fontSize: 14, color: COLORS.dark }}>
                  Mã đặt phòng của quý khách: <strong style={{ color: COLORS.gold, fontSize: 16 }}>{createdBookingCode}</strong>
                </Text>
                <div style={{ 
                  margin: '20px 0', padding: 15, background: '#f8f9fa', borderRadius: 8, textAlign: 'left',
                  borderLeft: `4px solid ${COLORS.gold}`
                }}>
                  <Text style={{ display: 'block', fontSize: 13 }}>Loại phòng: <strong>{selectedRoomForBooking?.name}</strong></Text>
                  <Text style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                    Thời gian: <strong>{bookingDates?.[0]?.format('DD/MM/YYYY')} - {bookingDates?.[1]?.format('DD/MM/YYYY')}</strong>
                  </Text>
                  <Text style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                    Số khách: <strong>{bookingAdults} Người lớn, {bookingChildren} Trẻ em</strong>
                  </Text>
                </div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 12 }}>
                  Đơn đặt phòng đang được hệ thống phê duyệt. Quý khách có thể quản lý lịch sử đặt phòng trong mục lịch sử của hồ sơ cá nhân.
                </Text>
                <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                  <Button 
                    onClick={() => {
                      setBookingModalVisible(false);
                      setSearchingState('idle');
                      setQuickVoucherCode('');
                    }}
                    style={{ height: 44, borderRadius: 8, width: 140 }}
                  >
                    ĐÓNG
                  </Button>
                  <Button 
                    type="primary"
                    onClick={() => navigate('/guest/bookings')}
                    style={{ height: 44, borderRadius: 8, background: COLORS.gold, border: 'none', fontWeight: 'bold', width: 200 }}
                  >
                    XEM LỊCH SỬ ĐẶT
                  </Button>
                </Space>
              </div>
            )}

            {/* 4. TRẠNG THÁI HẾT PHÒNG (NO-ROOMS) */}
            {searchingState === 'no-rooms' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ 
                  width: 72, height: 72, background: 'rgba(235, 94, 85, 0.1)', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', color: '#eb5e55', fontSize: 36, fontWeight: 'bold'
                }}>
                  ✕
                </div>
                <Title level={3} style={{ color: '#eb5e55', margin: 0 }}>ĐÃ HẾT PHÒNG TRỐNG!</Title>
                <Paragraph style={{ marginTop: 12, color: COLORS.gray, fontSize: 14 }}>
                  Rất tiếc! Hiện tại loại phòng <strong>{selectedRoomForBooking?.name}</strong> đã hết phòng trống hoặc không đủ sức chứa cho <strong>{bookingAdults} khách</strong> trong khoảng thời gian từ <strong>{bookingDates?.[0]?.format('DD/MM/YYYY')}</strong> đến <strong>{bookingDates?.[1]?.format('DD/MM/YYYY')}</strong>.
                </Paragraph>
                <div style={{ margin: '20px 0', padding: 15, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8 }}>
                  <Text style={{ color: '#cf1322', fontSize: 13 }}>
                    * Lời khuyên: Quý khách có thể thử thay đổi ngày lưu trú hoặc chọn các loại phòng khác còn trống trên trang danh sách phòng.
                  </Text>
                </div>
                <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                  <Button 
                    onClick={() => {
                      setBookingModalVisible(false);
                      setSearchingState('idle');
                      setQuickVoucherCode('');
                    }}
                    style={{ height: 44, borderRadius: 8, width: 140 }}
                  >
                    ĐÓNG
                  </Button>
                  <Button 
                    type="primary"
                    onClick={() => setSearchingState('idle')}
                    style={{ height: 44, borderRadius: 8, background: COLORS.gold, border: 'none', fontWeight: 'bold', width: 180 }}
                  >
                    CHỌN LẠI NGÀY
                  </Button>
                </Space>
              </div>
            )}

          </div>

        </div>
      </Modal>

    </Layout>
  );
};

export default RoomsPage;