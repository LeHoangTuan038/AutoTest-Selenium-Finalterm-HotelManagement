import { jwtDecode } from "jwt-decode";

export const getUserRoles = () => {
  const token = localStorage.getItem("token");
  if (!token) return [];

  try {
    const decoded = jwtDecode(token);

    let roles =
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    // 🔥 FIX CHÍNH Ở ĐÂY
    if (!roles) return [];

    if (Array.isArray(roles)) return roles;

    // nếu là string → convert thành array
    return [roles];
  } catch (err) {
    return [];
  }
};