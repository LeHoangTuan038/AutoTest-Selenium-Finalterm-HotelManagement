import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, 
  Select, message, Card, Typography, InputNumber, Upload, Row, Col, Popconfirm, Tabs
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UploadOutlined, LoadingOutlined, DownloadOutlined, FileExcelOutlined
} from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { auditLogger } from '../../utils/auditLogger';
import { useDamageEventStore } from '../../store/damageEventStore';
import { useEquipmentEventStore } from '../../store/equipmentEventStore';

const COLORS = {
  gold: '#d4af37',
  gray: '#8c8c8c'
};

const { Title, Text } = Typography;
const { Option } = Select;

const WarehouseManagement = () => {
  // Subscribe to global damage updates - real-time from store
  const lastDamageUpdate = useDamageEventStore((state) => state.lastDamageUpdate);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [damagedCount, setDamagedCount] = useState({}); 
  
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // States for Excel Export / Import features
  const [excelData, setExcelData] = useState([]);
  const [activeTab, setActiveTab] = useState('manual');
  const [importing, setImporting] = useState(false);
  const [excelError, setExcelError] = useState('');

  const [form] = Form.useForm();
  const lastKnownUpdateRef = useRef(0); 

  // --- FETCH DỮ LIỆU HỎNG/MẤT TỪ API ---
  const fetchDamagedCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5070/api/LossAndDamages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const counted = {};
      let totalDamaged = 0;
      
      res.data.forEach(record => {
        if (record.status === 'Chưa đền bù' || !record.status) {
          // Enhanced matching: exact name from parsed description + room
          const nameMatch = record.description.match(/^(.*?) - (Phòng|P\.)\s*\w+/i);
          const equipmentName = nameMatch ? nameMatch[1].trim() : record.description;
          const key = equipmentName;
          if (!counted[key]) counted[key] = 0;
          counted[key] += record.quantity || 1;
          totalDamaged++;
        }
      });

      
      setDamagedCount(counted);
      return counted;
    } catch (err) {
      console.error('❌ Lỗi fetch dữ liệu hỏng/mất:', err);
      return {};
    }
  }, []);

  // --- 1. LẤY DỮ LIỆU TỪ BẢNG EQUIPMENTS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // ĐỔI API TỪ Amenities SANG Equipments
      const res = await axios.get('http://localhost:5070/api/Equipments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      fetchDamagedCount();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải dữ liệu kho (Kiểm tra xem đã tạo API EquipmentsController chưa)!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem('damagedCount');
    if (saved) setDamagedCount(JSON.parse(saved));
    
    const interval = setInterval(() => { fetchDamagedCount(); }, 5000);
    
    const handleDamageStatusChange = () => { fetchDamagedCount(); };
    const unsubscribe = useDamageEventStore.subscribe(
      (state) => state.lastDamageUpdate,
      handleDamageStatusChange
    );
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (lastDamageUpdate > 0 && lastDamageUpdate !== lastKnownUpdateRef.current) {
      lastKnownUpdateRef.current = lastDamageUpdate;
      fetchDamagedCount();
    }
  }, [lastDamageUpdate, fetchDamagedCount]);

  // --- 2. UPLOAD ẢNH QUA BACKEND LÊN CLOUDINARY ---
  const handleUploadCloudinary = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    
    const API_UPLOAD_URL = `${import.meta.env.VITE_API_URL}/Upload/image`;
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(API_UPLOAD_URL, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      const uploadedUrl = res.data.url;
      setImageUrl(uploadedUrl); 
      form.setFieldsValue({ imageUrl: uploadedUrl }); 
      onSuccess("Ok");
      message.success('Tải ảnh lên Cloud thành công!');
    } catch (err) {
      onError({ err });
      message.error('Tải ảnh thất bại! ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // EXCEL FEATURE HANDLERS
  // ==========================================

  // 1. Xuất báo cáo Kho Vật Tư ra file Excel
  const handleExportExcel = () => {
    try {
      const exportData = data.map(item => {
        let recordDamageCount = 0;
        Object.keys(damagedCount).forEach(key => {
          if (key === item.name || key.includes(item.name)) recordDamageCount += damagedCount[key];
        });
        
        return {
          'Mã Vật Tư': item.itemCode || '',
          'Tên Vật Tư': item.name || '',
          'Danh Mục': item.category || '',
          'Đơn Vị Tính': item.unit || '',
          'Tổng Số Lượng': item.totalQuantity || 0,
          'Đang Sử Dụng': item.inUseQuantity || 0,
          'Có Thể Cấp': item.inStockQuantity || 0,
          'Sự Cố (Báo Hỏng)': recordDamageCount,
          'Giá Nhập (VND)': item.basePrice || 0,
          'Giá Đền Bù (VND)': item.defaultPriceIfLost || item.compensationPrice || 0,
          'Nhà Cung Cấp': item.supplier || '',
          'Ngày Cập Nhật': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Định dạng độ rộng cột
      const wscols = [
        { wch: 12 }, // Mã Vật Tư
        { wch: 25 }, // Tên Vật Tư
        { wch: 15 }, // Danh Mục
        { wch: 12 }, // Đơn Vị Tính
        { wch: 15 }, // Tổng Số Lượng
        { wch: 15 }, // Đang Sử Dụng
        { wch: 15 }, // Có Thể Cấp
        { wch: 18 }, // Sự Cố (Báo Hỏng)
        { wch: 16 }, // Giá Nhập
        { wch: 16 }, // Giá Đền Bù
        { wch: 20 }, // Nhà Cung Cấp
        { wch: 15 }  // Ngày Cập Nhật
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Kho Vat Tu");
      XLSX.writeFile(wb, `Bao_Cao_Kho_Vat_Tu_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      message.success("Xuất file báo cáo Excel thành công!");
      auditLogger.info("Đã xuất báo cáo kho vật tư ra file Excel", {
        action: 'Xuất Excel', actionType: 'EXPORT', module: 'Kho Vật Tư'
      });
    } catch (err) {
      console.error("Lỗi xuất Excel:", err);
      message.error("Lỗi khi xuất file Excel!");
    }
  };

  // 2. Tải file Excel mẫu
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          'Mã Vật Tư': 'VT001',
          'Tên Vật Tư': 'Khăn Tắm Trắng Cao Cấp',
          'Danh Mục': 'Tiêu hao',
          'Đơn Vị Tính': 'Cái',
          'Tổng Số Lượng': 100,
          'Giá Nhập (VND)': 50000,
          'Giá Đền Bù (VND)': 75000,
          'Nhà Cung Cấp': 'Công ty Dệt Phong Phú'
        },
        {
          'Mã Vật Tư': 'VT002',
          'Tên Vật Tư': 'Tivi Sony 55 inch Smart 4K',
          'Danh Mục': 'Điện tử',
          'Đơn Vị Tính': 'Chiếc',
          'Tổng Số Lượng': 15,
          'Giá Nhập (VND)': 12000000,
          'Giá Đền Bù (VND)': 15000000,
          'Nhà Cung Cấp': 'Điện Máy Xanh'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wscols = [
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
        { wch: 25 }
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mau Nhap Kho");
      XLSX.writeFile(wb, "Mau_Nhap_Vat_Tu_Kho.xlsx");
      message.success("Đã tải file Excel mẫu thành công!");
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải file mẫu!");
    }
  };

  // 3. Đọc dữ liệu từ file Excel
  const handleParseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        const workbook = XLSX.read(fileContent, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        
        if (!rows || rows.length === 0) {
          message.error("File Excel không có dữ liệu!");
          return;
        }

        const expectedHeaders = ['Mã Vật Tư', 'Tên Vật Tư', 'Danh Mục', 'Đơn Vị Tính', 'Tổng Số Lượng', 'Giá Nhập (VND)', 'Giá Đền Bù (VND)'];
        const firstRow = rows[0];
        const rowKeys = Object.keys(firstRow);
        const hasRequiredHeaders = expectedHeaders.every(header => rowKeys.includes(header));
        
        if (!hasRequiredHeaders) {
          setExcelError("File Excel thiếu các cột bắt buộc! Vui lòng tải file mẫu để kiểm tra.");
          message.error("Định dạng file không đúng!");
          return;
        }

        const formattedRows = rows.map((row, idx) => ({
          key: idx,
          itemCode: String(row['Mã Vật Tư'] || '').trim(),
          name: String(row['Tên Vật Tư'] || '').trim(),
          category: String(row['Danh Mục'] || 'Khác').trim(),
          unit: String(row['Đơn Vị Tính'] || 'Cái').trim(),
          totalQuantity: Number(row['Tổng Số Lượng'] || 0),
          basePrice: Number(row['Giá Nhập (VND)'] || 0),
          compensationPrice: Number(row['Giá Đền Bù (VND)'] || 0),
          defaultPriceIfLost: Number(row['Giá Đền Bù (VND)'] || 0),
          supplier: String(row['Nhà Cung Cấp'] || '').trim()
        }));

        setExcelData(formattedRows);
        setExcelError('');
        message.success(`Đã đọc thành công ${formattedRows.length} dòng từ Excel!`);
      } catch (err) {
        console.error("Lỗi đọc Excel:", err);
        message.error("Lỗi khi đọc file Excel!");
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  // --- 3. MỞ FORM THÊM MỚI ---
  const handleAddNew = () => {
    setEditingItem(null);
    setImageUrl('');
    setExcelData([]);
    setExcelError('');
    setActiveTab('manual');
    form.resetFields();
    setIsModalVisible(true);
  };

  // --- 4. MỞ FORM SỬA ---
  const handleEdit = (record) => {
    setEditingItem(record);
    setImageUrl(record.imageUrl); 
    setActiveTab('manual');
    const editValues = {
      ...record,
      compensationPrice: record.compensationPrice || record.defaultPriceIfLost || 0
    };
    form.setFieldsValue(editValues);
    setIsModalVisible(true);
  };


  // --- 5. LƯU DỮ LIỆU VÀO EQUIPMENTS ---
  const handleSave = async () => {
    // 🛑 CHỌN NHẬP EXCEL HOẶC THỦ CÔNG KHI THÊM MỚI
    if (activeTab === 'excel' && !editingItem) {
      if (excelData.length === 0) {
        message.warning("Vui lòng tải lên file Excel có dữ liệu!");
        return;
      }
      
      setImporting(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < excelData.length; i++) {
        const item = excelData[i];
        try {
          // Kiểm tra xem vật tư này đã tồn tại trong DB chưa (theo Mã hoặc Tên)
          const existing = data.find(x => 
            (x.itemCode && item.itemCode && x.itemCode.toLowerCase() === item.itemCode.toLowerCase()) ||
            (x.name && item.name && x.name.toLowerCase() === item.name.toLowerCase())
          );

          if (existing) {
            // Tự động cộng dồn số lượng vào vật tư hiện tại
            const updatedTotal = (existing.totalQuantity || 0) + item.totalQuantity;
            const payload = {
              ...existing,
              totalQuantity: updatedTotal,
              basePrice: item.basePrice || existing.basePrice,
              defaultPriceIfLost: item.compensationPrice || existing.defaultPriceIfLost || existing.compensationPrice,
              supplier: item.supplier || existing.supplier,
              category: item.category || existing.category,
              unit: item.unit || existing.unit,
              updatedAt: new Date()
            };

            await axios.put(`http://localhost:5070/api/Equipments/${existing.id}`, payload, { headers });
            
            auditLogger.success(`Đã cộng dồn số lượng vật tư từ Excel: +${item.totalQuantity} vào ${existing.name}`, {
              action: 'Sửa (Excel cộng dồn)', actionType: 'UPDATE', module: 'Kho Vật Tư',
              objectName: existing.name,
              oldValue: existing, newValue: payload,
            });
          } else {
            // Thêm mới hoàn toàn
            const payload = {
              itemCode: item.itemCode,
              name: item.name,
              category: item.category,
              unit: item.unit,
              totalQuantity: item.totalQuantity,
              inStockQuantity: item.totalQuantity,
              inUseQuantity: 0,
              damagedQuantity: 0,
              liquidatedQuantity: 0, // Bắt buộc cho database constraint NOT NULL
              basePrice: item.basePrice,
              defaultPriceIfLost: item.compensationPrice, // Map chuẩn C# property
              supplier: item.supplier,
              isActive: true
            };

            await axios.post('http://localhost:5070/api/Equipments', payload, { headers });
            
            auditLogger.success(`Đã nhập vật tư mới từ Excel: ${item.name}`, {
              action: 'Thêm (Excel)', actionType: 'CREATE', module: 'Kho Vật Tư',
              objectName: item.name,
              newValue: payload,
            });
          }

          successCount++;
        } catch (err) {
          const serverError = err.response?.data?.message || err.response?.data || err.message;
          console.error(`Lỗi khi nhập dòng ${i + 1}:`, serverError);
          failCount++;
        }
      }

      setImporting(false);
      setIsModalVisible(false);
      setExcelData([]);
      fetchData();
      
      // Trigger global equipment update to sync with other pages
      useEquipmentEventStore.getState().triggerEquipmentUpdate();

      if (failCount === 0) {
        message.success(`Nhập thành công toàn bộ ${successCount} vật tư từ file Excel! 🎉`);
      } else {
        message.warning(`Nhập hoàn tất: ${successCount} thành công, ${failCount} thất bại. Vui lòng kiểm tra lại.`);
      }
      return;
    }

    // --- NHẬP THỦ CÔNG ---
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      if (editingItem) {
        // CẬP NHẬT/SỬA VẬT TƯ CÓ SẴN
        const finalPayload = {
          ...values,
          defaultPriceIfLost: values.compensationPrice, // Vá lỗi C# mapping
          liquidatedQuantity: editingItem.liquidatedQuantity || 0,
          inStockQuantity: editingItem.inStockQuantity,
          inUseQuantity: editingItem.inUseQuantity,
          damagedQuantity: editingItem.damagedQuantity,
          isActive: true
        };

        await axios.put(`http://localhost:5070/api/Equipments/${editingItem.id}`, { ...editingItem, ...finalPayload }, { headers });
        
        auditLogger.success(`Đã cập nhật thông tin vật tư: ${values.name}`, {
          action: 'Sửa', actionType: 'UPDATE', module: 'Kho Vật Tư',
          objectName: values.name,
          oldValue: editingItem, newValue: values,
        });
      } else {
        // THÊM MỚI VẬT TƯ THỦ CÔNG - KIỂM TRA ĐỊNH DANH ĐÃ TỒN TẠI CHƯA
        const existing = data.find(x => 
          (x.itemCode && values.itemCode && x.itemCode.toLowerCase() === values.itemCode.toLowerCase()) ||
          (x.name && values.name && x.name.toLowerCase() === values.name.toLowerCase())
        );

        if (existing) {
          // Tự động cộng dồn số lượng vật tư
          const updatedTotal = (existing.totalQuantity || 0) + values.totalQuantity;
          const finalPayload = {
            ...existing,
            totalQuantity: updatedTotal,
            basePrice: values.basePrice || existing.basePrice,
            defaultPriceIfLost: values.compensationPrice || existing.defaultPriceIfLost || existing.compensationPrice,
            supplier: values.supplier || existing.supplier,
            category: values.category || existing.category,
            unit: values.unit || existing.unit
          };

          await axios.put(`http://localhost:5070/api/Equipments/${existing.id}`, finalPayload, { headers });
          
          message.success(`Vật tư "${existing.name}" đã tồn tại. Đã tự động cộng dồn số lượng: +${values.totalQuantity} vào tổng kho! 🎉`);
          
          auditLogger.success(`Đã cộng dồn số lượng vật tư thủ công: +${values.totalQuantity} vào ${existing.name}`, {
            action: 'Sửa (Cộng dồn thủ công)', actionType: 'UPDATE', module: 'Kho Vật Tư',
            objectName: existing.name,
            oldValue: existing, newValue: finalPayload,
          });
        } else {
          // Thêm mới hoàn toàn
          const finalPayload = {
            ...values,
            defaultPriceIfLost: values.compensationPrice, // Vá lỗi C# mapping
            liquidatedQuantity: 0, // Mặc định số lượng thanh lý bằng 0
            inStockQuantity: values.totalQuantity,
            inUseQuantity: 0,
            damagedQuantity: 0,
            isActive: true
          };

          await axios.post('http://localhost:5070/api/Equipments', finalPayload, { headers });
          
          auditLogger.success(`Đã nhập vật tư mới vào kho: ${values.name}`, {
            action: 'Thêm', actionType: 'CREATE', module: 'Kho Vật Tư',
            objectName: values.name,
            newValue: values,
          });
        }
      }

      // Trigger global equipment update to sync with other pages
      useEquipmentEventStore.getState().triggerEquipmentUpdate();
      
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      console.log("Lỗi form:", error);
    }
  };

  // --- 6. XÓA VẬT TƯ ---
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const deletingItem = data.find(item => item.id === id);
      const itemName = deletingItem?.name || 'Vật tư';
      
      await axios.delete(`http://localhost:5070/api/Equipments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      auditLogger.success(`Đã xóa vật tư: ${itemName}`, {
        action: 'Xóa', actionType: 'DELETE', module: 'Kho Vật Tư',
        objectName: itemName,
        oldValue: deletingItem,
      });
      fetchData();
    } catch (err) {
      message.error("Lỗi khi xóa!");
    }
  };

  // CHỈNH SỬA CỘT MAP VỚI BẢNG EQUIPMENTS MỚI
  const columns = [
    { 
      title: 'Ảnh', 
      dataIndex: 'imageUrl', 
      key: 'imageUrl', 
      render: (img) => img ? <img src={img} alt="item" style={{ width: 45, height: 45, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }} /> : <Tag>No Image</Tag>
    },
    { title: 'Mã VT', dataIndex: 'itemCode', key: 'itemCode', render: t => <Tag color="purple" style={{ fontWeight: 'bold' }}>{t}</Tag> },
    { title: 'Tên thiết bị/vật tư', dataIndex: 'name', key: 'name', render: t => <Text strong>{t}</Text> },
    { 
      title: 'Tổng kho', 
      dataIndex: 'totalQuantity', 
      key: 'totalQuantity',
      render: (q, record) => <Tag color="blue">{q} {record.unit}</Tag>
    },
    { 
      title: 'Đang dùng', 
      dataIndex: 'inUseQuantity', 
      key: 'inUseQuantity',
      render: (q, record) => <Tag color="orange">{q} {record.unit}</Tag>
    },
    { 
      title: 'Có thể cấp', 
      dataIndex: 'inStockQuantity', 
      key: 'inStockQuantity',
      render: (q, record) => (
        <b style={{ color: q > 0 ? '#52c41a' : '#f5222d' }}>
          {q} {record.unit}
        </b>
      )
    },
    { 
      title: 'Sự cố (Cảnh báo)', 
      dataIndex: 'damagedCount', 
      key: 'damagedCount',
      render: (_, record) => {
        let count = 0;
        Object.keys(damagedCount).forEach(key => {
          if (key === record.name || key.includes(record.name)) count += damagedCount[key];
        });

        return (
          <Tag color={count > 0 ? 'red' : 'default'} style={{ cursor: count > 0 ? 'pointer' : 'default' }}>
            {count} {count > 0 ? '⚠️' : '✓'}
          </Tag>
        );
      }
    },
    { title: 'Danh mục', dataIndex: 'category', key: 'category', render: c => <Tag color="geekblue">{c}</Tag> },
    { 
      title: 'Giá nhập', 
      dataIndex: 'basePrice', 
      key: 'basePrice',
      render: p => <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0)}</span>
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" ghost icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm title="Xóa vật tư này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button type="primary" danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ margin: 24, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Kho Vật Tư Khách Sạn</Title>
          <Text type="secondary">Quản lý nhập xuất vật tư tổng trên hệ thống Cloudinary</Text>
        </div>
        <Space size="middle">
          <Button 
            type="default" 
            size="large" 
            icon={<FileExcelOutlined style={{ color: '#52c41a' }} />} 
            onClick={handleExportExcel} 
            style={{ borderRadius: 8, height: 45, display: 'flex', alignItems: 'center' }}
          >
            Xuất file Excel
          </Button>
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAddNew} 
            style={{ borderRadius: 8, height: 45 }}
          >
            Nhập vật tư mới
          </Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: 1100 }} />

      <Modal
        title={editingItem ? "Cập Nhật Vật Tư" : "Thêm Vật Tư Vào Kho"}
        open={isModalVisible}
        onCancel={() => !importing && setIsModalVisible(false)}
        onOk={handleSave}
        width={activeTab === 'excel' && !editingItem ? 850 : 720}
        centered
        okText={importing ? "Đang lưu dữ liệu..." : "Lưu dữ liệu"}
        cancelText="Đóng"
        confirmLoading={importing}
        cancelButtonProps={{ disabled: importing }}
      >
        {editingItem ? (
          // RENDER PHƯƠNG THỨC THỦ CÔNG KHI SỬA
          <Form form={form} layout="vertical" style={{ marginTop: 15 }}>
            <Form.Item name="imageUrl" hidden><Input /></Form.Item>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Hình ảnh (Cloudinary)">
                  <Upload 
                    customRequest={handleUploadCloudinary}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button icon={uploading ? <LoadingOutlined /> : <UploadOutlined />} loading={uploading}>
                      {uploading ? 'Đang tải lên...' : 'Chọn ảnh từ máy tính'}
                    </Button>
                  </Upload>
                  {imageUrl && (
                    <div style={{ marginTop: 15 }}>
                      <img src={imageUrl} alt="preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #fadb14' }} />
                    </div>
                  )}
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item label="Mã vật tư" name="itemCode" rules={[{ required: true }]}>
                  <Input placeholder="VD: VT001" />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="Tên vật tư" name="name" rules={[{ required: true }]}>
                  <Input placeholder="VD: Khăn tắm, Tivi..." />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item label="Danh mục" name="category" rules={[{ required: true }]}>
                  <Select placeholder="Chọn danh mục">
                    <Option value="Tiêu hao">Đồ tiêu hao</Option>
                    <Option value="Điện tử">Thiết bị điện tử</Option>
                    <Option value="Nội thất">Nội thất</Option>
                    <Option value="Khác">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Nhà cung cấp" name="supplier">
                  <Input placeholder="Tên công ty" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Đơn vị tính" name="unit" rules={[{ required: true }]}>
                  <Input placeholder="Cái, Chiếc..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Số lượng tổng" name="totalQuantity" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Giá nhập" name="basePrice" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} formatter={v => `₫ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Giá đền bù (Nếu mất/hỏng)" name="compensationPrice" rules={[{ required: true }]}>  
                  <InputNumber style={{ width: '100%' }} formatter={v => `₫ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>  
              </Col>
            </Row>
          </Form>
        ) : (
          // DÙNG TABS CHO VIỆC THÊM MỚI (CHỌN THỦ CÔNG HOẶC EXCEL)
          <Tabs 
            activeKey={activeTab} 
            onChange={(key) => setActiveTab(key)} 
            style={{ marginTop: 10 }}
            items={[
              {
                key: 'manual',
                label: <span>Nhập thủ công</span>,
                children: (
                  <Form form={form} layout="vertical" style={{ marginTop: 15 }}>
                    <Form.Item name="imageUrl" hidden><Input /></Form.Item>

                    <Row gutter={16}>
                      <Col span={24}>
                        <Form.Item label="Hình ảnh (Cloudinary)">
                          <Upload 
                            customRequest={handleUploadCloudinary}
                            showUploadList={false}
                            accept="image/*"
                          >
                            <Button icon={uploading ? <LoadingOutlined /> : <UploadOutlined />} loading={uploading}>
                              {uploading ? 'Đang tải lên...' : 'Chọn ảnh từ máy tính'}
                            </Button>
                          </Upload>
                          {imageUrl && (
                            <div style={{ marginTop: 15 }}>
                              <img src={imageUrl} alt="preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #fadb14' }} />
                            </div>
                          )}
                        </Form.Item>
                      </Col>

                      <Col span={8}>
                        <Form.Item label="Mã vật tư" name="itemCode" rules={[{ required: true }]}>
                          <Input placeholder="VD: VT001" />
                        </Form.Item>
                      </Col>
                      <Col span={16}>
                        <Form.Item label="Tên vật tư" name="name" rules={[{ required: true }]}>
                          <Input placeholder="VD: Khăn tắm, Tivi..." />
                        </Form.Item>
                      </Col>
                      
                      <Col span={12}>
                        <Form.Item label="Danh mục" name="category" rules={[{ required: true }]}>
                          <Select placeholder="Chọn danh mục">
                            <Option value="Tiêu hao">Đồ tiêu hao</Option>
                            <Option value="Điện tử">Thiết bị điện tử</Option>
                            <Option value="Nội thất">Nội thất</Option>
                            <Option value="Khác">Khác</Option>
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item label="Nhà cung cấp" name="supplier">
                          <Input placeholder="Tên công ty" />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item label="Đơn vị tính" name="unit" rules={[{ required: true }]}>
                          <Input placeholder="Cái, Chiếc..." />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Số lượng tổng" name="totalQuantity" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item label="Giá nhập" name="basePrice" rules={[{ required: true }]}>
                          <InputNumber style={{ width: '100%' }} formatter={v => `₫ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Giá đền bù (Nếu mất/hỏng)" name="compensationPrice" rules={[{ required: true }]}>  
                          <InputNumber style={{ width: '100%' }} formatter={v => `₫ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                        </Form.Item>  
                      </Col>
                    </Row>
                  </Form>
                )
              },
              {
                key: 'excel',
                label: <span>Nhập bằng file Excel 📊</span>,
                children: (
                  <div style={{ padding: '10px 0', textAlign: 'left' }}>
                    <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text strong style={{ fontSize: 15 }}>Tải vật tư lên từ file Excel</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 13 }}>Hãy nhập đầy đủ thông tin theo định dạng file mẫu dưới đây.</Text>
                      </div>
                      <Button 
                        type="dashed" 
                        icon={<DownloadOutlined />} 
                        onClick={handleDownloadTemplate}
                        style={{ borderColor: COLORS.gold, color: COLORS.gold }}
                      >
                        Tải file Excel mẫu
                      </Button>
                    </div>

                    <Upload.Dragger
                      accept=".xlsx, .xls"
                      beforeUpload={handleParseExcel}
                      showUploadList={false}
                      style={{ padding: '20px 0', background: '#fafafa', borderRadius: 12 }}
                      disabled={importing}
                    >
                      <p className="ant-upload-drag-icon" style={{ fontSize: 40, color: COLORS.gold, marginBottom: 10 }}>
                        <FileExcelOutlined />
                      </p>
                      <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 'bold' }}>
                        Nhấp hoặc kéo thả file Excel vào đây để tải lên
                      </p>
                      <p className="ant-upload-hint" style={{ fontSize: 12, color: '#8c8c8c' }}>
                        Hỗ trợ định dạng .xlsx, .xls. Dữ liệu sẽ được hiển thị xem trước ngay bên dưới.
                      </p>
                    </Upload.Dragger>

                    {excelError && (
                      <div style={{ marginTop: 15, padding: '10px 15px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8, color: '#ff4d4f' }}>
                        ⚠️ {excelError}
                      </div>
                    )}

                    {excelData.length > 0 && (
                      <div style={{ marginTop: 25 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                          <Text strong style={{ color: '#52c41a' }}>📊 Bản xem trước dữ liệu Excel ({excelData.length} dòng):</Text>
                          <Button type="link" danger onClick={() => setExcelData([])} style={{ padding: 0 }} disabled={importing}>Xóa bảng</Button>
                        </div>
                        <Table
                          dataSource={excelData}
                          rowKey="key"
                          pagination={{ pageSize: 5 }}
                          size="small"
                          bordered
                          columns={[
                            { title: 'Mã VT', dataIndex: 'itemCode', key: 'itemCode', width: 90 },
                            { title: 'Tên vật tư', dataIndex: 'name', key: 'name', ellipsis: true },
                            { title: 'Danh mục', dataIndex: 'category', key: 'category', width: 100 },
                            { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 70 },
                            { title: 'Số lượng', dataIndex: 'totalQuantity', key: 'totalQuantity', width: 90, render: q => <b>{q}</b> },
                            { title: 'Giá nhập', dataIndex: 'basePrice', key: 'basePrice', width: 110, render: p => `${p.toLocaleString('vi-VN')}đ` },
                            { title: 'Giá đền bù', dataIndex: 'compensationPrice', key: 'compensationPrice', width: 110, render: p => `${p.toLocaleString('vi-VN')}đ` },
                            { title: 'Nhà CC', dataIndex: 'supplier', key: 'supplier', ellipsis: true }
                          ]}
                        />
                      </div>
                    )}
                  </div>
                )
              }
            ]}
          />
        )}
      </Modal>
    </Card>
  );
};

export default WarehouseManagement;

