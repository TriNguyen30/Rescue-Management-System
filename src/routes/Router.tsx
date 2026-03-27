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
import AdminSystemSettings from "@/pages/AdminSystemSettings";
import AdminOperationsReport from "@/pages/AdminOperationsReport";
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
import ManagerSetting from "@/pages/ManagerSetting";
import ManagerLayout from "@/layouts/ManagerLayout";
import AdminLayout from "@/layouts/AdminLayout";
import DonationResult from "@/pages/DonationResult";

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
      <Route path="/donation-result" element={<DonationResult />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/analytics" element={<AdminOperationsReport />} />
        <Route path="/admin/settings" element={<AdminSystemSettings />} />
      </Route>
      <Route
        path="/manager"
        element={
          <ProtectedRoute requireManager>
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerDashboard />} />
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
          path="/manager/settings"
          element={
            <ProtectedRoute requireManager>
              <ManagerSetting />
            </ProtectedRoute>
          }
        />
      </Route>
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