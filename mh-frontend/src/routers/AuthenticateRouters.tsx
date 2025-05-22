import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { isTokenValid } from "../utils/auth";

export default function AuthenticateRouters() {
  const token = localStorage.getItem("access_token");
  const location = useLocation();

  // If token missing or expired → redirect to landing, opening Login tab
  if (!token || !isTokenValid(token)) {
    return (
      <Navigate to="/" replace state={{ from: location, openLogin: true }} />
    );
  }

  // Otherwise allow access
  return <Outlet />;
}
