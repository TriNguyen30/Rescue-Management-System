import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

type ProtectedRouteProps = {
  children: React.ReactElement;
  requireAdmin?: boolean;
};

export default function ProtectedRoute({
  children,
  requireAdmin,
}: ProtectedRouteProps) {
  const { token, user } = useAppSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.admin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
