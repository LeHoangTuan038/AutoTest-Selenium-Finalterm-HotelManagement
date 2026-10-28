import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getUserRoles } from "../utils/auth";

const RoleBasedRoute = ({ allowedRoles }) => {
  const roles = getUserRoles();

  console.log("Roles:", roles);

  const isAllowed = roles.some((r) => allowedRoles.includes(r));

  if (!isAllowed) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};

export default RoleBasedRoute;