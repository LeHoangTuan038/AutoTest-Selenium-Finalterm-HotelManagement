import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import Các Lớp Bảo Vệ
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleBasedRoute from "./routes/RoleBasedRoute";
import HomePage from "./pages/HomePage";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import UserListPage from "./pages/admin/UserListPage";
import RoomManagement from "./pages/admin/RoomManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import HousekeeperDashboard from "./pages/housekeeper/HousekeeperDashboard";
import GuestDashboard from "./pages/guest/GuestDashboard";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import WarehouseManagement from "./pages/admin/WarehouseManagement";
import LossAndDamageManagement from "./pages/admin/LossAndDamageManagement";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import PostsManagement from "./pages/admin/PostsManagement";
import PromotionsManagement from "./pages/admin/PromotionsManagement";
import Accounting from "./pages/admin/Accounting";
import HousekeepingManagement from './pages/admin/HousekeepingManagement';
import BookingManagement from "./pages/admin/BookingManagement";
import CheckoutList from "./pages/admin/CheckoutList";
import InvoicePage from "./pages/receptionist/InvoicePage";
import CheckoutPage from "./pages/receptionist/CheckoutPage";
import UserProfilePage from "./pages/profile/UserProfilePage.jsx";
import BookingPage from "./pages/guest/BookingPage";
import RoomBookingPage from "./pages/guest/RoomBookingPage";
import GuestInvoicePage from "./pages/guest/GuestInvoicePage";
import GuestRankPage from "./pages/guest/GuestRankPage";
import GuestReviewsPage from "./pages/guest/GuestReviewsPage";

// 🚨 IMPORT TRANG DANH SÁCH PHÒNG
import RoomsPage from './pages/RoomsPage';
import NewsPage from './pages/NewsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// IMPORT 2 TRANG LỄ TÂN
import Arrivals from "./pages/admin/Arrivals";
import InHouse from "./pages/admin/InHouse";
import RoomDetailPage from "./pages/guest/RoomDetailPage";
import PostDetailPage from "./pages/guest/PostDetailPage";

const NotFoundPage = () => <h1>404 - Đường dẫn này không tồn tại 😢</h1>;
const UnauthorizedPage = () => (
  <h1>403 - BẠN KHÔNG CÓ QUYỀN VÀO KHU VỰC NÀY 🛑</h1>
);

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/homepage" replace />} />

      {/* 2. TUYẾN ĐƯỜNG TỰ DO (AI CŨNG VÀO ĐƯỢC) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/room/:id" element={<RoomDetailPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* 3. VÙNG CẤM CHUNG (PHẢI ĐĂNG NHẬP MỚI VÀO ĐƯỢC) */}
        <Route element={<ProtectedRoute />}>

          {/* --- KHU VỰC DÙNG CHUNG CHO ADMIN & LỄ TÂN --- */}
          <Route element={<RoleBasedRoute allowedRoles={["Admin", "Receptionist"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/warehouse" element={<WarehouseManagement />} />
              <Route path="/admin/loss-and-damage" element={<LossAndDamageManagement />} />
              <Route path="/admin/bookings" element={<BookingManagement />} />
              <Route path="/admin/checkout" element={<CheckoutList />} />
              <Route path="/admin/invoice" element={<InvoicePage />} />
              <Route path="/admin/invoice/:id" element={<InvoicePage />} />

              <Route path="/admin/arrivals" element={<Arrivals />} />
              <Route path="/admin/in-house" element={<InHouse />} />
              <Route path="/admin/invoices" element={<InvoicePage />} />
              
              <Route path="/admin/rooms" element={<RoomManagement />} />
              <Route path="/receptionist/invoice-draft/:bookingId" element={<InvoicePage />} />
            </Route>
          </Route>

          {/* --- KHU VỰC DÙNG CHUNG CHO ADMIN, LỄ TÂN & BUỒNG PHÒNG --- */}
          <Route element={<RoleBasedRoute allowedRoles={["Admin", "Receptionist", "Housekeeping"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/housekeeping" element={<HousekeepingManagement />} />
            </Route>
          </Route>

          {/* --- KHU VỰC DÀNH RIÊNG CHO ADMIN --- */}
          <Route element={<RoleBasedRoute allowedRoles={["Admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserListPage />} />
              <Route path="/admin/inventory" element={<InventoryManagement />} />
              <Route path="/admin/audit" element={<AuditLogsPage />} />
              <Route path="/admin/posts" element={<PostsManagement />} />
              <Route path="/admin/promotions" element={<PromotionsManagement />} />
              <Route path="/admin/accounting" element={<Accounting />} />
            </Route>
          </Route>

          {/* --- KHU VỰC DÀNH CHO RECEPTIONIST --- */}
          <Route element={<RoleBasedRoute allowedRoles={["Receptionist"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
              <Route path="/receptionist/checkout" element={<CheckoutPage />} />
            </Route>
          </Route>

          {/* --- KHU VỰC DÀNH CHO HOUSEKEEPER --- */}
          <Route element={<RoleBasedRoute allowedRoles={["Housekeeping"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/housekeeper/dashboard" element={<HousekeeperDashboard />} />
            </Route>
          </Route>

          {/* --- KHU VỰC DÀNH CHO GUEST --- */}
          <Route element={<RoleBasedRoute allowedRoles={["Guest"]} />}>
            <Route path="/guest/dashboard" element={<GuestDashboard />} />
            <Route path="/guest/bookings" element={<BookingPage />} />
            <Route path="/guest/book-room" element={<RoomBookingPage />} />
            <Route path="/guest/invoices" element={<GuestInvoicePage />} />
            <Route path="/guest/profile" element={<UserProfilePage />} />
            <Route path="/guest/rank" element={<GuestRankPage />} />
            <Route path="/guest/reviews" element={<GuestReviewsPage />} />
          </Route>

        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;