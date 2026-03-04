import { Route, Routes } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Home from "@/pages/Citizen";
import Map from "@/pages/Map";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Contact from "@/pages/Contact";
import ProtectedRoute from "./ProtectedRoute";
import UserManagement from "@/pages/UserManagement";
import ManagerDashboard from "@/pages/ManagerDashboard";
import CoordinatorDashboard from "@/pages/CoordinatorDashboard";
import RescueTeamDashboard from "@/pages/RescueTeamDashboard";
import InventoryManagement from "@/pages/InventoryManagement";
import AdminDashboard from "@/pages/AdminDashboard";
import VehicleManagement from "@/pages/VehicleManagement";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map/>} />
      </Route>
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute requireManager>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/inventories"
        element={
          <ProtectedRoute requireManager>
            <InventoryManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/vehicle"
        element={
          <ProtectedRoute requireManager>
            <VehicleManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator"
        element={
          <ProtectedRoute requireCoordinator>
            <CoordinatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rescue-team"
        element={
          <ProtectedRoute requireRescueTeam>
            <RescueTeamDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
