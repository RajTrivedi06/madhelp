/* src/AuthenticateRouters.tsx */
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isTokenValid } from "@/lib/auth"; // adjust import to your project structure

export default function AuthenticateRouters() {
  const token = localStorage.getItem("access_token");
  let valid = false;

  // Safely verify token validity
  try {
    valid = token ? isTokenValid(token) : false;
  } catch {
    valid = false;
  }

  const location = useLocation();
  if (!token || !valid) {
    return (
      <Navigate to="/" replace state={{ from: location, openLogin: true }} />
    );
  }

  return <Outlet />;
}
