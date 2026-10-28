import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { notification } from 'antd';
import { useAdminAuthStore } from '../store/adminAuthStore';

const RequirePermission = ({ permission, children }) => {
  // Đọc mảng quyền hạn (permissions) từ Zustand Store [cite: 220, 318]
  const permissions = useAdminAuthStore((state) => state.permissions) || [];
  
  // Kiểm tra xem user có quyền này không
  const hasPermission = permissions.includes(permission);

  if (!hasPermission) {
    // Xử lý lỗi 403 Forbidden theo đúng chuẩn tài liệu (Hiển thị thông báo, không logout) [cite: 720-722]
    notification.error({
      message: 'Lỗi phân quyền',
      description: 'Bạn không có quyền thực hiện thao tác này',
    });
    
    // Nếu dùng để bọc Route -> Đá về trang chủ Admin. 
    // Nếu dùng để bọc Nút bấm -> Ẩn nút đó đi (return null).
    return children ? null : <Navigate to="/admin" replace />;
  }

  // Nếu hợp lệ: Trả về nội dung con (children) hoặc Outlet (cho Nested Routes) [cite: 199, 682]
  return children ? children : <Outlet />;
};

export default RequirePermission;