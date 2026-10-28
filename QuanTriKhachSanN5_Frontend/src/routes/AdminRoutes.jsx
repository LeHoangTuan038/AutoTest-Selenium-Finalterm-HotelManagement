import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore';

// Layout & Pages
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/auth/LoginPage';
import UserListPage from '../pages/admin/UserListPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import UserProfilePage from '../pages/profile/UserProfilePage.jsx';

// 👉 Thêm RequirePermission
import RequirePermission from '../components/RequirePermission';

// Component bảo vệ route
const ProtectedRoute = ({ children }) => {
  const token = useAdminAuthStore(state => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Cụm Route dành cho Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* 👉 Bọc permission cho users */}
        <Route element={<RequirePermission permission="user.view" />}>
          <Route path="users" element={<UserListPage />} />
        </Route>

        {/* Audit Logs */}
        <Route path="audit" element={<AuditLogsPage />} />

        {/* Không cần permission */}
        <Route path="profile" element={<UserProfilePage />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;