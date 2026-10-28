import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Modal, Table, Button, Typography, Spin, Empty, Tag, Space, Popconfirm, Checkbox, Alert } from 'antd';
import { ClearOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined, BuildOutlined } from '@ant-design/icons';
import axios from 'axios';
import { auditLogger } from '../../utils/auditLogger';

const { Title, Text } = Typography;

const HousekeepingManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // State cho Modal Kiểm tra vật tư
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomInventory, setRoomInventory] = useState([]);
  const [isInventoryVisible, setIsInventoryVisible] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);


  const fetchCleaningRooms = async () => {
    setLoadingRooms(true);
    try {
      const token = localStorage.getItem('token');
      
      // SỬA ĐƯỜNG LINK Ở ĐÂY: Lấy đúng API của trang Quản Lý Phòng (Thường là /api/Rooms)
      // Ní nhớ đối chiếu lại xem file RoomManagement.jsx xài link gì thì thay link đó vào nha!
      const res = await axios.get('http://localhost:5070/api/Rooms', { 
        headers: { Authorization: `Bearer ${token}` }
      });

      // LỌC THEO CỘT DỌN DẸP & CHỜ KIỂM TRA CHECK-OUT
      const cleaningRooms = res.data.filter(r => {
         return r.status === 'Cleaning' || 
                r.status === 'Pending Check-out' || 
                r.cleaningStatus === 'Inspecting' || 
                r.cleaningStatus === 'Cleaning' ||
                r.cleaningStatus === 'Dirty';
      });

      setRooms(cleaningRooms);
    } catch (err) {
      auditLogger.error("Lỗi khi tải danh sách phòng cần dọn!", { module: "Nhiệm vụ Dọn Phòng" });
    } finally {
      setLoadingRooms(false);
    }
  };


  useEffect(() => {
    fetchCleaningRooms();
  }, []);

  // 2. XỬ LÝ HOÀN TẤT DỌN PHÒNG (ĐỔI SANG AVAILABLE)
  const handleCompleteCleaning = async (roomId) => {
    try {
      const token = localStorage.getItem('token');
      const userName = localStorage.getItem('userName') || 'Housekeeping Staff';
      const userEmail = localStorage.getItem('userEmail') || 'housekeeper@hotel.com';
      
      // Gọi đúng API "mark-clean" vừa tạo ở C#
      await axios.put(`http://localhost:5070/api/RoomInventory/rooms/${roomId}/mark-clean`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Lấy thông tin phòng
      const room = rooms.find(r => r.id === roomId);
      
      
      auditLogger.success(`✅ Đã hoàn tất dọn sạch phòng ${room?.roomNumber}! Phòng sẵn sàng đón khách.`, {
        action: 'Hoàn tất',
        actionType: 'UPDATE',
        module: 'Nhiệm vụ Dọn Phòng',
        objectName: `Phòng ${room?.roomNumber}`,
        description: `Hoàn tất dọn sạch phòng ${room?.roomNumber}. Trạng thái chuyển từ "Cleaning" sang "Available"`,
        oldValue: { status: 'Cleaning', cleaningStatus: 'Cleaning' },
        newValue: { status: 'Available', cleaningStatus: 'Clean' },
      });
      fetchCleaningRooms(); // Load lại là bay màu ngay lập tức!
      setIsInventoryVisible(false);
    } catch (error) {
      console.error(error);
      auditLogger.error("❌ Lỗi khi cập nhật trạng thái phòng!", { module: 'Nhiệm vụ Dọn Phòng' });
    }
  };

  // 3. XỬ LÝ MỞ MODAL KIỂM TRA VẬT TƯ
  const handleCheckInventory = async (room) => {
    const userName = localStorage.getItem('userName') || 'Housekeeping Staff';
    const userEmail = localStorage.getItem('userEmail') || 'housekeeper@hotel.com';
    
    setSelectedRoom(room);
    setIsConfirmed(false);
    setIsInventoryVisible(true);
    setLoadingInventory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5070/api/RoomInventory/rooms/${room.id}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoomInventory(res.data);
      
      // Thêm audit log cho việc kiểm tra đồ đạc
      auditLogger.success(`📋 Đang kiểm tra ${res.data.length} vật tư của phòng ${room.roomNumber}`, {
        action: 'Kiểm tra',
        actionType: 'OTHER',
        module: 'Nhiệm vụ Dọn Phòng',
        objectName: `Phòng ${room.roomNumber} - Kiểm tra đồ đạc`,
        description: `Bắt đầu kiểm tra tài sản và vật tư của phòng ${room.roomNumber}. Tổng ${res.data.length} vật tư cần kiểm tra.`,
        newValue: { totalItems: res.data.length, activeItems: res.data.filter(i => i.isActive).length },
      });
    } catch (err) {
      auditLogger.error("❌ Lỗi tải danh sách vật tư!", { module: 'Nhiệm vụ Dọn Phòng' });
    } finally {
      setLoadingInventory(false);
    }
  };

  // 4. XỬ LÝ BÁO HỎNG (Y chang trang Inventory)
  const handleReportDamage = (record) => {
    Modal.confirm({
      title: 'Xác nhận báo hỏng / mất tài sản',
      content: <div>Bạn xác nhận vật tư <b style={{color: 'red'}}>{record.amenity?.name}</b> ở phòng <b>{selectedRoom?.roomNumber}</b> bị hỏng hoặc mất?</div>,
      okText: 'Báo hỏng ngay',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const userName = localStorage.getItem('userName') || 'Housekeeping Staff';
          const userEmail = localStorage.getItem('userEmail') || 'housekeeper@hotel.com';
          
          const damagePayload = {
            roomInventoryId: record.id, 
            quantity: 1, 
            penaltyAmount: record.amenity?.price || record.amenity?.importPrice || 500000, 
            description: `Phòng ${selectedRoom?.roomNumber} - Khách check-out làm hỏng/mất ${record.amenity?.name}`, 
            status: 'Chưa đền bù'
          };

          await axios.post('http://localhost:5070/api/LossAndDamages', damagePayload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Thêm audit log cho báo hỏng
          auditLogger.success(`✅ Đã lập biên bản báo hỏng ${record.amenity?.name}! Lễ tân đã nhận được thông báo.`, {
            action: 'Báo hỏng',
            actionType: 'CREATE',
            module: 'Nhiệm vụ Dọn Phòng',
            objectName: `${record.amenity?.name} - Phòng ${selectedRoom?.roomNumber}`,
            description: `Báo hỏng/mất vật tư: ${record.amenity?.name} tại phòng ${selectedRoom?.roomNumber}. Giá bù trừ: ${record.amenity?.price || record.amenity?.importPrice || 500000} đ`,
            newValue: { 
              amenity: record.amenity?.name, 
              roomNumber: selectedRoom?.roomNumber,
              quantity: 1,
              penaltyAmount: record.amenity?.price || record.amenity?.importPrice || 500000,
              status: 'Chưa đền bù'
            },
          });
          
          setRoomInventory(prev => prev.map(item => 
              item.id === record.id ? { ...item, isActive: false } : item
          ));
        } catch (error) {
          auditLogger.error("❌ Lỗi báo hỏng!", { module: 'Nhiệm vụ Dọn Phòng' });
        }
      }
    });
  };

  // Cột cho bảng kiểm tra vật tư
  const columns = [
    { 
      title: 'Tên Vật Tư', 
      key: 'amenityName', 
      render: (_, record) => (
        <Space>
          {record.isActive ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          <b style={{ color: record.isActive ? '#262626' : '#8c8c8c', textDecoration: record.isActive ? 'none' : 'line-through' }}>
            {record.amenity?.name}
          </b>
        </Space>
      ) 
    },
    { 
      title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'center',
      render: (qty) => <Tag color="blue">{qty}</Tag>
    },
    {
      title: 'Thao tác Kiểm tra', key: 'action', align: 'center',
      render: (_, record) => {
        const isDamaged = !record.isActive; 
        return (
          <Button size="small" type="primary" danger disabled={isDamaged} onClick={() => handleReportDamage(record)}>
            {isDamaged ? 'Đã báo hỏng' : 'Báo hỏng / Mất'}
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #e8e8e8' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#1f1f1f' }}>Nhiệm Vụ Dọn Phòng</Title>
          <Text type="secondary">Danh sách các phòng khách vừa Check-out cần kiểm tra đồ đạc và dọn dẹp</Text>
        </div>
        <Button icon={<SyncOutlined />} onClick={fetchCleaningRooms} type="primary" ghost>Làm mới</Button>
      </div>

      <Spin spinning={loadingRooms}>
        {rooms.length === 0 ? (
          <Empty description="Tuyệt vời! Hiện tại không có phòng nào cần dọn." style={{ marginTop: 100 }} />
        ) : (
          <Row gutter={[24, 24]}>
            {rooms.map(room => {
              const isPendingCheckOut = room.status === 'Pending Check-out';
              const ribbonText = isPendingCheckOut ? 'Chờ kiểm tra check-out ⏳' : (room.cleaningStatus === 'Inspecting' ? 'Đang Kiểm Tra' : 'Đang Dọn');
              const ribbonColor = isPendingCheckOut ? '#fa8c16' : (room.cleaningStatus === 'Inspecting' ? '#faad14' : '#1890ff');
              const cardBorderColor = isPendingCheckOut ? '#ffd591' : '#91d5ff';
              const iconColor = isPendingCheckOut ? '#fa8c16' : '#1890ff';

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
                  <Badge.Ribbon text={ribbonText} color={ribbonColor}>
                    <Card hoverable style={{ borderRadius: 16, border: `1px solid ${cardBorderColor}`, backgroundColor: isPendingCheckOut ? '#fffdf6' : '#fff' }}>
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <ClearOutlined style={{ fontSize: 40, color: iconColor, marginBottom: 10 }} />
                        <Title level={4} style={{ margin: 0 }}>Phòng {room.roomNumber}</Title>
                        <Text type="secondary">{room.roomTypeName}</Text>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Button 
                          type="primary" 
                          block 
                          icon={<BuildOutlined />} 
                          onClick={() => handleCheckInventory(room)}
                          style={{
                            backgroundColor: isPendingCheckOut ? '#fa8c16' : undefined,
                            borderColor: isPendingCheckOut ? '#fa8c16' : undefined
                          }}
                        >
                          Kiểm tra & Xác nhận dọn dẹp
                        </Button>
                      </div>
                    </Card>
                  </Badge.Ribbon>
                </Col>
              );
            })}
          </Row>
        )}
      </Spin>

      {/* MODAL KIỂM TRA ĐỒ ĐẠC */}
      <Modal
        title={`Kiểm tra tài sản & Xác nhận dọn dẹp - Phòng ${selectedRoom?.roomNumber}`}
        open={isInventoryVisible}
        onCancel={() => setIsInventoryVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsInventoryVisible(false)}>
            Quay lại
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            disabled={!isConfirmed} 
            loading={loadingRooms} 
            onClick={() => handleCompleteCleaning(selectedRoom.id)}
            style={{ 
              backgroundColor: isConfirmed ? '#52c41a' : undefined, 
              borderColor: isConfirmed ? '#52c41a' : undefined,
              color: isConfirmed ? '#fff' : undefined
            }}
          >
            {selectedRoom?.status === 'Pending Check-out' ? 'Hoàn tất kiểm tra & Xác nhận sạch sẽ' : 'Hoàn tất dọn dẹp & Xác nhận sạch sẽ'}
          </Button>
        ]}
        width={700}
      >
        <Spin spinning={loadingInventory}>
          <div style={{ marginBottom: 16 }}>
            {selectedRoom?.status === 'Pending Check-out' ? (
              <Alert
                message={<span style={{ fontWeight: 'bold', color: '#c45100' }}>⚠️ QUY TRÌNH CHECK-OUT ĐANG CHỜ KIỂM TRA</span>}
                description="Khách hàng đang làm thủ tục trả phòng tại quầy lễ tân! Vui lòng đối chiếu thật kỹ danh sách vật tư bên dưới. Nếu phát hiện hư hại hoặc thất thoát, hãy nhấn nút 'Báo hỏng / Mất' ngay lập tức để hệ thống tự động tính phụ thu đền bù vào hóa đơn của khách."
                type="warning"
                showIcon
                style={{ borderRadius: 8 }}
              />
            ) : (
              <Alert
                message="Dọn dẹp định kỳ & Kiểm tra phòng"
                description="Vui lòng kiểm tra kỹ lưỡng danh sách tài sản/vật tư phòng để đảm bảo chất lượng phục vụ tốt nhất."
                type="info"
                showIcon
                style={{ borderRadius: 8 }}
              />
            )}
          </div>
          
          <Table columns={columns} dataSource={roomInventory} rowKey="id" pagination={false} bordered />

          <div style={{ marginTop: 20, padding: '16px', backgroundColor: '#f6ffed', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
            <Checkbox 
              checked={isConfirmed} 
              onChange={(e) => setIsConfirmed(e.target.checked)}
            >
              <span style={{ fontWeight: '600', color: '#389e0d', fontSize: '14px' }}>
                {selectedRoom?.status === 'Pending Check-out' 
                  ? "Tôi xác nhận đã hoàn tất kiểm tra phòng, tài sản đầy đủ & dọn dẹp sạch sẽ để sẵn sàng trả phòng."
                  : "Tôi xác nhận đã hoàn tất kiểm tra tất cả đồ đạc và dọn dẹp sạch sẽ phòng này."}
              </span>
            </Checkbox>
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default HousekeepingManagement;