import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Badge, Modal, Table, Button, Input, 
  Typography, message, Empty, Tag, Space, Spin, Form, Select, InputNumber, Popconfirm, Divider, Image, Tabs
} from 'antd';

import { 
  HomeOutlined, BuildOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, SyncOutlined, PlusOutlined, DeleteOutlined,
  PictureOutlined, MinusCircleOutlined, FilterOutlined, CopyOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { auditLogger } from '../../utils/auditLogger';
import { useDamageEventStore } from '../../store/damageEventStore';

const { Title, Text } = Typography;
const { Option } = Select;

const InventoryManagement = () => {
  
  const [rooms, setRooms] = useState([]); 
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  const [selectedRoom, setSelectedRoom] = useState(null); 
  const [roomInventory, setRoomInventory] = useState([]); 
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [amenitiesList, setAmenitiesList] = useState([]);  
  const [addSearchText, setAddSearchText] = useState('');
  const [form] = Form.useForm();

  // Clone/Transfer States
  const [isCloneModalVisible, setIsCloneModalVisible] = useState(false);
  const [sourceRoomId, setSourceRoomId] = useState(null);
  const [sourceInventory, setSourceInventory] = useState([]);
  const [loadingSourceInventory, setLoadingSourceInventory] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [transferQuantities, setTransferQuantities] = useState({}); // amenityId -> qty
  const [isMove, setIsMove] = useState(false);
  const [cloning, setCloning] = useState(false);

  // Reset add search when opening modal
  const resetAddFilters = () => {
    setAddSearchText('');
  };

  const handleSourceRoomChange = async (value) => {
    setSourceRoomId(value);
    setSourceInventory([]);
    setSelectedRowKeys([]);
    setTransferQuantities({});
    if (!value) return;

    setLoadingSourceInventory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5070/api/RoomInventory/rooms/${value}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeItems = (res.data || []).filter(item => item.isActive === true);
      setSourceInventory(activeItems);
      // Initialize default quantities to the max available quantity
      const defaultQtys = {};
      activeItems.forEach(item => {
        defaultQtys[item.amenityId] = item.quantity;
      });
      setTransferQuantities(defaultQtys);
    } catch (err) {
      message.error("Lỗi khi tải vật tư phòng nguồn!");
    } finally {
      setLoadingSourceInventory(false);
    }
  };

  const handleCloneSubmit = async () => {
    if (!sourceRoomId) {
      message.warning("Vui lòng chọn phòng nguồn!");
      return;
    }
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một vật tư để chuyển giao!");
      return;
    }

    setCloning(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        sourceRoomId: sourceRoomId,
        targetRoomId: selectedRoom.id,
        isMove: isMove,
        items: selectedRowKeys.map(amenityId => ({
          amenityId: parseInt(amenityId, 10),
          quantity: transferQuantities[amenityId] || 1
        }))
      };

      await axios.post('http://localhost:5070/api/RoomInventory/transfer', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success(isMove ? "Đã di chuyển vật tư thành công!" : "Đã sao chép vật tư thành công!");
      
      const sourceRoom = rooms.find(r => r.id === sourceRoomId);
      auditLogger.success(`Đã chuyển giao vật tư từ phòng ${sourceRoom?.roomNumber} sang phòng ${selectedRoom?.roomNumber}`, {
        action: isMove ? 'Di chuyển vật tư' : 'Sao chép vật tư',
        actionType: 'UPDATE',
        module: 'Vật Tư Theo Phòng',
        objectName: `Phòng ${selectedRoom?.roomNumber}`,
        description: `${isMove ? 'Di chuyển' : 'Sao chép'} ${payload.items.length} mặt hàng`,
        newValue: payload
      });

      setIsCloneModalVisible(false);
      setSourceRoomId(null);
      setSourceInventory([]);
      setSelectedRowKeys([]);
      setTransferQuantities({});
      setIsMove(false);

      fetchRoomInventoryDetails(selectedRoom.id);
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi thực hiện!");
    } finally {
      setCloning(false);
    }
  };



  // Filtered inventory logic
  const filteredInventory = roomInventory.filter(record => {
    const matchesSearch = !searchText || 
      (record.amenity?.name || '').toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && record.isActive === true) ||
      (filterStatus === 'damaged' && record.isActive === false);
    return matchesSearch && matchesStatus;
  });

  // Filtered amenities for add modal
  const filteredAmenities = amenitiesList.filter(item => {
    const matchesSearch = !addSearchText || item.name.toLowerCase().includes(addSearchText.toLowerCase());
    // Filter by category if needed in future
    return matchesSearch;
  });


  const resetFilters = () => {
    setSearchText('');
    setFilterStatus('all');
  };

  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedRoomType, setSelectedRoomType] = useState('all');


  const fetchData = async () => {
    setLoadingRooms(true);
    try {
      const token = localStorage.getItem('token'); 
      const headers = { Authorization: `Bearer ${token}` };

      const resRooms = await axios.get('http://localhost:5070/api/RoomInventory/rooms', { headers });
      setRooms(resRooms.data);

      const resAmenities = await axios.get('http://localhost:5070/api/RoomInventory/amenities', { headers });
      setAmenitiesList(resAmenities.data);
    } catch (err) {
      message.error("Lỗi kết nối máy chủ. Vui lòng thử lại!");
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchRoomInventoryDetails = async (roomId) => {
    setSearchText('');
    setFilterStatus('all');
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5070/api/RoomInventory/rooms/${roomId}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoomInventory(res.data);
    } catch (err) {
      message.error("Lỗi khi lấy chi tiết vật tư của phòng!");
    } finally {
      setLoadingDetails(false);
    }
  };


  useEffect(() => {
    fetchData();
    const handleDamageStatusChange = () => { if (selectedRoom) fetchRoomInventoryDetails(selectedRoom.id); };
    const unsubscribe = useDamageEventStore.subscribe((state) => state.lastDamageUpdate, handleDamageStatusChange);
    return () => unsubscribe();
  }, [selectedRoom]);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setIsDetailVisible(true);
    fetchRoomInventoryDetails(room.id);
  };

  const handleAddInventory = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      const itemsToAdd = values.items || [];

      if (!itemsToAdd || itemsToAdd.length === 0 || itemsToAdd.some(item => !item.amenityId || !item.quantity)) {
        message.warning("Vui lòng chọn vật tư và số lượng hợp lệ!");
        return;
      }

      const token = localStorage.getItem('token');

      setLoadingDetails(true);

      const payloadBulk = itemsToAdd.map(item => ({
        roomId: selectedRoom.id,
        amenityId: parseInt(item.amenityId, 10), 
        quantity: parseInt(item.quantity, 10),
        isActive: true
      })).filter(item => item.amenityId && item.quantity > 0);

      if (payloadBulk.length === 0) {
        message.warning("Không có vật tư hợp lệ để thêm!");
        return;
      }

      await axios.post(`http://localhost:5070/api/RoomInventory/rooms/${selectedRoom.id}/inventory/bulk`, payloadBulk, {
        headers: { Authorization: `Bearer ${token}` }
      });

      auditLogger.success(`Đã cấp phát ${payloadBulk.length} vật tư thành công cho phòng ${selectedRoom?.roomNumber}!`, {
        action: 'Cấp phát',
        actionType: 'CREATE',
        module: 'Vật Tư Theo Phòng',
        objectName: `Phòng ${selectedRoom?.roomNumber}`,
        description: `Cấp phát ${payloadBulk.length} loại vật tư mới`,
        newValue: payloadBulk
      });

      setIsAddModalVisible(false);
      form.resetFields();
      fetchRoomInventoryDetails(selectedRoom.id);
    } catch (error) {
      console.error('Form validation error:', error);
      if (error.errorFields) {
        message.error("Vui lòng điền đầy đủ thông tin vật tư!");
      } else {
        message.error(error.response?.data?.message || "Có lỗi xảy ra!");
      }
    } finally {
      setLoadingDetails(false);
    }
  };


  const handleDeleteInventory = async (inventoryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5070/api/RoomInventory/${inventoryId}`, { headers: { Authorization: `Bearer ${token}` } });
      message.success('Đã thu hồi vật tư thành công!');
      fetchRoomInventoryDetails(selectedRoom.id);
    } catch (error) { message.error("Lỗi khi xóa vật tư!"); }
  };

  const handleReportDamage = (record) => {
    Modal.confirm({
      title: 'Xác nhận báo hỏng tài sản',
      content: <div>Bạn xác nhận vật tư <b style={{color: 'red'}}>{record.amenity?.name}</b> ở phòng <b>{selectedRoom?.roomNumber}</b> đã bị hỏng?</div>,
      okText: 'Báo hỏng', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const payload = { 
            roomInventoryId: Number(record.id), 
            quantity: 1, 
            penaltyAmount: Number(record.amenity?.price || 0), 
            description: `Phòng ${selectedRoom?.roomNumber} - ${record.amenity?.name}`, 
            status: 'Chưa đền bù',
            imageUrl: "" // Bùa chú lấp chỗ trống để C# khỏi ăn vạ
          };

          await axios.post('http://localhost:5070/api/LossAndDamages', payload, { headers: { Authorization: `Bearer ${token}` } });
          
          auditLogger.success(`Đã báo hỏng ${record.amenity?.name} tại phòng ${selectedRoom?.roomNumber}!`, {
            action: 'Báo hỏng',
            actionType: 'CREATE',
            module: 'Vật Tư Theo Phòng',
            objectName: `${record.amenity?.name} - Phòng ${selectedRoom?.roomNumber}`,
            description: `Báo hỏng vật tư ${record.amenity?.name}. Giá đền bù: ${record.amenity?.price}`,
            newValue: payload
          });

          useDamageEventStore.getState().triggerDamageUpdate();
          fetchRoomInventoryDetails(selectedRoom.id);
        } catch (error) { 
          // 🚨 BỨC CUNG LỖI THẬT: Ép React phải hiện chi tiết lỗi từ C#
          console.error("Chi tiết lỗi Backend:", error.response?.data);
          
          let errorMsg = "Lỗi khi báo hỏng vật tư!";
          if (error.response?.data?.message) {
            // Lỗi do anh em mình tự viết (Ví dụ: "Không tìm thấy phòng...")
            errorMsg = error.response.data.message; 
          } else if (error.response?.data?.errors) {
            // Lỗi tự động của C# (Ví dụ: Thiếu cột, sai kiểu số)
            errorMsg = "Lỗi C#: " + JSON.stringify(error.response.data.errors);
          }
          
          // Hiển thị cục thông báo đỏ choạng
          message.error({ content: errorMsg, duration: 5 }); 
        }
      }
    });
  };

  const handleRestoreInventory = async (inventoryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5070/api/RoomInventory/restore/${inventoryId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      const item = roomInventory.find(i => i.id === inventoryId);
      auditLogger.success('Đã xác nhận thay mới vật tư thành công!', {
        action: 'Thay mới',
        actionType: 'UPDATE',
        module: 'Vật Tư Theo Phòng',
        objectName: `${item?.amenity?.name || 'Vật tư'} - Phòng ${selectedRoom?.roomNumber}`,
        description: `Thay mới vật tư đã hỏng: ${item?.amenity?.name || 'Vật tư'}`,
        newValue: { isActive: true }
      });

      useDamageEventStore.getState().triggerDamageUpdate();
      fetchRoomInventoryDetails(selectedRoom.id);
    } catch (error) { message.error("Lỗi cập nhật!"); }
  };

  const getStatusUI = (status) => {
    switch (status) {
      case 'Available': return { text: 'Phòng Trống', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' };
      case 'Occupied': return { text: 'Có Khách', color: '#ff4d4f', bgColor: '#fff2f0', borderColor: '#ffccc7' };
      case 'Cleaning': return { text: 'Đang Dọn', color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' };
      case 'Maintenance': return { text: 'Bảo Trì', color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f' };
      default: return { text: status || 'Chưa rõ', color: '#8c8c8c', bgColor: '#fafafa', borderColor: '#d9d9d9' };
    }
  };

  const floorTabs = [
    { key: 'all', label: 'Tất cả các phòng' },
    ...[...new Set(rooms.map(room => {
      if (room.floor) return `Tầng ${room.floor}`;
      const firstChar = String(room.roomNumber).charAt(0);
      if (!isNaN(firstChar)) return `Tầng ${firstChar}`;
      if (String(room.roomNumber).toUpperCase().includes('VILLA')) return "Khu Villa";
      return "Khu Vực Khác";
    }))].sort().map(floor => ({ key: floor, label: floor }))
  ];

  const roomTypeOptions = [...new Set(rooms.map(room => room.roomTypeName).filter(Boolean))].sort();

  const filteredRooms = rooms.filter(room => {
    let floorLabel = "Khu Vực Khác";
    if (room.floor) floorLabel = `Tầng ${room.floor}`;
    else if (room.roomNumber) {
      const firstChar = String(room.roomNumber).charAt(0);
      if (!isNaN(firstChar)) floorLabel = `Tầng ${firstChar}`;
      else if (String(room.roomNumber).toUpperCase().includes('VILLA')) floorLabel = "Khu Villa";
    }

    const matchFloor = selectedFloor === 'all' || floorLabel === selectedFloor;
    const matchRoomType = selectedRoomType === 'all' || room.roomTypeName === selectedRoomType;

    return matchFloor && matchRoomType;
  });

  const columns = [
    { 
      title: 'Thông tin vật tư', key: 'amenityInfo', 
      render: (_, record) => (
        <Space align="center" size="middle">
          {record.amenity?.imageUrl ? (
            <Image width={50} height={50} src={record.amenity.imageUrl} style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8' }} fallback="https://via.placeholder.com/50" />
          ) : (
            <div style={{ width: 50, height: 50, backgroundColor: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8e8e8' }}><PictureOutlined style={{ color: '#bfbfbf', fontSize: 20 }} /></div>
          )}
          <div>
            <div style={{ color: '#262626', fontWeight: 'bold', fontSize: 15 }}>
              {record.isActive ? <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} /> : <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />}
              {record.amenity?.name || 'Không xác định'}
            </div>
            {record.amenity?.price > 0 && <Text type="secondary" style={{ fontSize: 12 }}>Giá đền bù: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.amenity.price)}</Text>}
          </div>
        </Space>
      ) 
    },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'center', render: (qty) => <Tag color="geekblue" style={{ fontWeight: 'bold', fontSize: 14 }}>{qty}</Tag> },
    { title: 'Tình trạng', dataIndex: 'isActive', key: 'isActive', align: 'center', render: (isActive) => <Tag color={isActive ? 'success' : 'error'} style={{ borderRadius: 12 }}>{isActive ? 'Hoạt động tốt' : 'Hỏng/Cần thay'}</Tag> },
    { title: 'Thao tác', key: 'action', align: 'center', render: (_, record) => (
        <Space>
          {!record.isActive ? (
            <Button size="small" type="primary" style={{backgroundColor: '#52c41a'}} icon={<CheckCircleOutlined />} onClick={() => handleRestoreInventory(record.id)}>Thay mới</Button>
          ) : (
            <Button size="small" type="primary" danger ghost icon={<ExclamationCircleOutlined />} onClick={() => handleReportDamage(record)}>Báo hỏng</Button>
          )}
          <Popconfirm title="Xóa vật tư này?" onConfirm={() => handleDeleteInventory(record.id)} okText="Xóa"><Button size="small" type="text" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      
      {/* 🚨 ĐÃ XÓA NÚT "LÀM MỚI" Ở ĐÂY 🚨 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16 }}>
        <div><Title level={3} style={{ margin: 0 }}>Sơ Đồ Tài Sản Phòng</Title><Text type="secondary">Quản lý vật tư thiết bị từng phòng</Text></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 600 }}>
          <Tabs 
            type="card" 
            size="large"
            activeKey={selectedFloor} 
            onChange={setSelectedFloor} 
            items={floorTabs}
            tabBarStyle={{ marginBottom: 0, fontWeight: '500' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '6px 16px', borderRadius: 8, border: '1px solid #d9d9d9', height: 40 }}>
          <FilterOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          <Text strong style={{ marginRight: 12 }}>Loại phòng:</Text>
          <Select 
            value={selectedRoomType} 
            onChange={setSelectedRoomType} 
            style={{ width: 220 }} 
            bordered={false}
            showSearch
            options={[{ value: 'all', label: 'Tất cả loại phòng' }, ...roomTypeOptions.map(t => ({ value: t, label: t }))]}
          />
        </div>
      </div>

      <Spin spinning={loadingRooms} description="Đang tải dữ liệu phòng..." size="large">
        <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: '0 8px 8px 8px', border: '1px solid #f0f0f0', minHeight: 400 }}>
          {filteredRooms.length === 0 ? (
            <Empty description="Không có phòng nào phù hợp với bộ lọc" style={{ marginTop: 50 }} />
          ) : (
            <Row gutter={[24, 24]}>
              {filteredRooms.map(room => {
                const ui = getStatusUI(room.status);
                return (
                  <Col xs={12} sm={12} md={8} lg={6} xl={4} key={room.id}>
                    <Badge.Ribbon text={ui.text} color={ui.color}>
                      <Card hoverable style={{ borderRadius: 16, textAlign: 'center', border: `1px solid ${ui.borderColor}` }} onClick={() => handleRoomClick(room)}>
                        <div style={{ width: 64, height: 64, margin: '0 auto 16px auto', backgroundColor: ui.bgColor, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><HomeOutlined style={{ fontSize: 32, color: ui.color }} /></div>
                        <Title level={4} style={{ margin: 0 }}>P. {room.roomNumber}</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>{room.roomTypeName || 'Chưa phân loại'}</Text>
                      </Card>
                    </Badge.Ribbon>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      </Spin>

      <Modal title={`Danh sách tài sản - P.${selectedRoom?.roomNumber}`} open={isDetailVisible} onCancel={() => { resetFilters(); setIsDetailVisible(false); }} footer={null} width={950} destroyOnClose centered zIndex={1000}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <Input.Search 
              placeholder="Tìm theo tên vật tư..." 
              value={searchText} 
              onChange={e => setSearchText(e.target.value)} 
              style={{ width: 280 }}
              allowClear
            />
            <Select 
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 160 }}
              placeholder="Lọc trạng thái"
            >
              <Option value="all">Tất cả</Option>
              <Option value="active">Hoạt động tốt</Option>
              <Option value="damaged">Hỏng/Cần thay</Option>
            </Select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={resetFilters}>Xóa bộ lọc</Button>
            <Button 
              type="default" 
              icon={<CopyOutlined style={{ color: '#faad14' }} />} 
              onClick={() => setIsCloneModalVisible(true)}
              style={{ borderColor: '#faad14', color: '#faad14' }}
            >
              Sao chép/Di chuyển
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>Thêm Vật Tư</Button>
          </div>
        </div>
        <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: '#f5f7fa', borderRadius: 8, border: '1px solid #e8e8e8' }}>
          <Text strong>Kết quả: {filteredInventory.length} / {roomInventory.length} vật tư</Text>
        </div>
        <Table columns={columns} dataSource={filteredInventory} rowKey="id" pagination={false} bordered loading={loadingDetails} scroll={{ x: 650 }} />
      </Modal>


      <Modal title={`Cấp phát vật tư - P.${selectedRoom?.roomNumber}`} open={isAddModalVisible} onOk={handleAddInventory} onCancel={() => { resetAddFilters(); setIsAddModalVisible(false); form.resetFields(); }} width={1000} centered zIndex={1050}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <Input.Search 
              placeholder="Tìm vật tư để thêm..." 
              value={addSearchText} 
              onChange={e => setAddSearchText(e.target.value)} 
              style={{ width: 280 }}
              allowClear
              onSearch={resetAddFilters}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{filteredAmenities.length}/{amenitiesList.length} vật tư</span>
          </div>
        </div>
        
        <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid #d9d9d9', borderRadius: 8, marginBottom: 16 }}>
          <Table
            size="small"
            pagination={false}
            columns={[
              {
                title: 'Vật tư available',
                render: (_, item, index) => (
                  <Space>
                    {item.imageUrl ? <img src={item.imageUrl} style={{width: 32, height: 32, objectFit: 'cover', borderRadius: 4}} /> : <PictureOutlined />}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>ID: {item.id}</Text>
                    </div>
                  </Space>
                )
              }
            ]}
            dataSource={filteredAmenities.slice(0, 20)}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => {
                form.setFieldsValue({
                  items: [{ amenityId: record.id, quantity: 1 }]
                });
              }
            })}
            rowClassName="selectable-row"
            locale={{ emptyText: 'Không tìm thấy vật tư nào' }}
          />
        </div>
        
        <Form form={form} layout="vertical">
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'amenityId']} rules={[{ required: true, message: 'Chọn món đồ!' }]} style={{ width: 320, marginBottom: 0 }}>
                      <Select showSearch optionFilterProp="label" size="large">
                        {filteredAmenities.map(item => (
                          <Option key={item.id} value={item.id} label={item.name}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {item.imageUrl ? <img src={item.imageUrl} style={{width: 24, height: 24, objectFit: 'cover', borderRadius: 4}}/> : <PictureOutlined />}
                              {item.name}
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Nhập SL!' }]} style={{ width: 100, marginBottom: 0 }}>
                      <InputNumber min={1} size="large" placeholder="SL" style={{ width: '100%' }} />
                    </Form.Item>
                    {fields.length > 1 ? <MinusCircleOutlined style={{ color: 'red', fontSize: 20, cursor: 'pointer' }} onClick={() => remove(name)} /> : null}
                  </Space>
                ))}
                <Form.Item style={{ marginTop: 16 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large">
                    Thêm dòng khác
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal 
        title={`Chuyển giao / Sao chép vật tư sang P.${selectedRoom?.roomNumber}`} 
        open={isCloneModalVisible} 
        onOk={handleCloneSubmit} 
        onCancel={() => { 
          setIsCloneModalVisible(false);
          setSourceRoomId(null);
          setSourceInventory([]);
          setSelectedRowKeys([]);
          setTransferQuantities({});
          setIsMove(false);
        }} 
        width={850} 
        centered 
        zIndex={1050}
        confirmLoading={cloning}
        okText={cloning ? "Đang xử lý..." : "Xác nhận chuyển giao"}
        cancelText="Hủy bỏ"
      >
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>1. Chọn phòng nguồn để chuyển vật tư đi:</Text>
          <Select
            placeholder="Chọn phòng nguồn"
            style={{ width: '100%', height: 40 }}
            value={sourceRoomId}
            onChange={handleSourceRoomChange}
            showSearch
            optionFilterProp="label"
          >
            {rooms
              .filter(r => r.id !== selectedRoom?.id)
              .map(room => (
                <Option key={room.id} value={room.id} label={`P. ${room.roomNumber} - ${room.roomTypeName}`}>
                  P. {room.roomNumber} ({room.roomTypeName})
                </Option>
              ))}
          </Select>
        </div>

        {sourceRoomId && (
          <Spin spinning={loadingSourceInventory} description="Đang tải vật tư phòng nguồn...">
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong>2. Chọn các vật tư cần chuyển giao và điều chỉnh số lượng:</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text type="secondary">Chế độ chuyển giao:</Text>
                  <Select 
                    value={isMove} 
                    onChange={setIsMove} 
                    style={{ width: 220 }}
                    options={[
                      { value: false, label: 'Sao chép (Giữ nguyên phòng cũ)' },
                      { value: true, label: 'Di chuyển (Trừ số lượng ở phòng cũ)' }
                    ]}
                  />
                </div>
              </div>

              <Table
                dataSource={sourceInventory}
                rowKey="amenityId"
                pagination={false}
                bordered
                size="small"
                scroll={{ y: 250 }}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys)
                }}
                columns={[
                  {
                    title: 'Vật tư',
                    key: 'amenityName',
                    render: (_, record) => (
                      <Space>
                        {record.amenity?.imageUrl ? (
                          <img src={record.amenity.imageUrl} style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }} />
                        ) : (
                          <PictureOutlined />
                        )}
                        <Text strong>{record.amenityName || record.amenity?.name}</Text>
                      </Space>
                    )
                  },
                  {
                    title: 'Số lượng hiện tại',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 150,
                    align: 'center',
                    render: (qty) => <Tag color="blue">{qty}</Tag>
                  },
                  {
                    title: 'Số lượng chuyển',
                    key: 'transferQty',
                    width: 180,
                    align: 'center',
                    render: (_, record) => {
                      const isSelected = selectedRowKeys.includes(record.amenityId);
                      return (
                        <InputNumber
                          min={1}
                          max={record.quantity}
                          value={transferQuantities[record.amenityId] || 1}
                          disabled={!isSelected}
                          onChange={(val) => {
                            setTransferQuantities(prev => ({
                              ...prev,
                              [record.amenityId]: val
                            }));
                          }}
                          style={{ width: 100 }}
                        />
                      );
                    }
                  }
                ]}
              />
            </div>
          </Spin>
        )}
      </Modal>

    </div>
  );
};

export default InventoryManagement;