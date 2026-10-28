import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuthStore } from "../store/adminAuthStore";
import { getUserRoles } from "../utils/auth";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
