import { Route, Routes } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Home from "@/pages/Home";
import Citizen from "@/pages/Citizen";
import Map from "@/pages/Map";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Contact from "@/pages/Contact";
import ProtectedRoute from "./ProtectedRoute";
import UserManagement from "@/pages/UserManagement";
import ManagerDashboard from "@/pages/ManagerDashboard";
import CoordinatorDashboard from "@/pages/CoordinatorDashboard";
import RescueManagement from "@/pages/RescueManagement";
import InventoryManagement from "@/pages/InventoryManagement";
import AdminDashboard from "@/pages/AdminDashboard";
import VehicleManagement from "@/pages/VehicleManagement";
import RescueMap from "@/pages/RescueMap";
import RequestDetails from "@/pages/RequestDetails";
import RescueTeamDashboard from "@/pages/RescueTeamDashboard";
import RTRequestManagement from "@/pages/RescueRequestManagement";
import CoordinatorLayout from "@/layouts/CoordinatorLayout";
import RescueTeamLayout from "@/layouts/RescueTeamLayout";
import AssignedTaskDetails from "@/pages/AssignedTaskDetails";
import RequestsHistory from "@/pages/RequestsHistory";
import UserProfile from "@/pages/UserProfile";
import Donation from "@/pages/Donation";
import SearchNearbyRequests from "@/pages/SearchNearbyRequests";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/request" element={<Citizen />} />
        <Route path="/requests-history" element={<RequestsHistory />} />
        <Route path="/donate" element={<Donation />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<UserProfile />} />
      </Route>
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
        path="/manager/rescue-teams"
        element={
          <ProtectedRoute requireManager>
            <RescueManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/rescue-map"
        element={
          <ProtectedRoute requireManager>
            <RescueMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/requests"
        element={
          <ProtectedRoute requireManager>
            <RTRequestManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/requests/:id"
        element={
          <ProtectedRoute requireManager>
            <RequestDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator"
        element={
          <ProtectedRoute requireCoordinator>
            <CoordinatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CoordinatorDashboard />} />
        <Route path="requests/:id" element={<RequestDetails />} />
      </Route>
      <Route
        path="/rescue-team"
        element={
          <ProtectedRoute requireRescueTeam>
            <RescueTeamLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RescueTeamDashboard />} />
        <Route path="assigned-task/:id" element={<AssignedTaskDetails />} />
        <Route path="nearby" element={<SearchNearbyRequests />} />
      </Route>
    </Routes>
  );
}