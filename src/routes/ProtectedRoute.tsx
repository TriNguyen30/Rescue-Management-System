import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

type ProtectedRouteProps = {
  children: React.ReactElement;
  requireAdmin?: boolean;
  requireManager?: boolean;
  requireCoordinator?: boolean;
  requireRescueTeam?: boolean;
};

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireManager = false,
  requireCoordinator = false,
  requireRescueTeam = false,
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

  // Check quyền MANAGER
  if (requireManager && user.role !== "MANAGER") {
    return <Navigate to="/" replace />;
  }

  // Check quyền COORDINATOR
  if (requireCoordinator && user.role !== "COORDINATOR") {
    return <Navigate to="/" replace />;
  }

  // Check quyền RESCUE_TEAM
  if (requireRescueTeam && user.role !== "RESCUE_TEAM") {
    return <Navigate to="/" replace />;
  } 

  return children;
}
