import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

type ProtectedRouteProps = {
  children: React.ReactElement;
  requireAdmin?: boolean;
};

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { token, user } = useAppSelector((state) => state.auth);

  // Chưa đăng nhập
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check quyền ADMIN
  if (requireAdmin && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}
