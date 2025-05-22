import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/auth";

export default function NonAuthenticatedRouters() {
  const token = localStorage.getItem("access_token");

  // If already logged in and token still valid → send to dashboard
  if (token && isTokenValid(token)) {
    return <Navigate to="/what-do-you-want" replace />;
  }

  // Otherwise let them see public routes
  return <Outlet />;
}
