import { Route, Routes } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Home from "@/features/home/Home";
import Citizen from "@/features/citizen/Citizen";
import Map from "@/features/citizen/Map";
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import Contact from "@/features/citizen/Contact";
import ProtectedRoute from "./ProtectedRoute";
import UserManagement from "@/features/users/UserManagement";
import ManagerDashboard from "@/features/manager/ManagerDashboard";
import CoordinatorDashboard from "@/features/manager/CoordinatorDashboard";
import RescueManagement from "@/features/manager/RescueManagement";
import InventoryManagement from "@/features/inventory/InventoryManagement";
import AdminDashboard from "@/features/admin/AdminDashboard";
import AdminOperationsReport from "@/features/admin/AdminOperationsReport";
import VehicleManagement from "@/features/vehicle/VehicleManagement";
import RescueMap from "@/features/manager/RescueMap";
import RequestDetails from "@/features/manager/RequestDetails";
import RescueTeamDashboard from "@/features/manager/RescueTeamDashboard";
import RTRequestManagement from "@/features/manager/RescueRequestManagement";
import CoordinatorLayout from "@/layouts/CoordinatorLayout";
import RescueTeamLayout from "@/layouts/RescueTeamLayout";
import AssignedTaskDetails from "@/features/manager/AssignedTaskDetails";
import RequestsHistory from "@/features/citizen/RequestsHistory";
import UserProfile from "@/features/users/UserProfile";
import Donation from "@/features/donation/Donation";
import SearchNearbyRequests from "@/features/citizen/SearchNearbyRequests";
import ManagerSetting from "@/features/manager/ManagerSetting";
import ManagerLayout from "@/layouts/ManagerLayout";
import AdminLayout from "@/layouts/AdminLayout";
import DonationResult from "@/features/donation/DonationResult";
import MyDonation from "@/features/donation/MyDonation";
import DonationHistory from "@/features/donation/DonationHistory";
import AdminSetting from "@/features/admin/AdminSetting";
import RescueTeamStatus from "@/features/manager/RescueTeamStatus";


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
        <Route path="/donation-history" element={<MyDonation />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/vnpay-return" element={<DonationResult />} />
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
        <Route path="/admin/settings" element={<AdminSetting />} />
        <Route path="/admin/revenue" element={<DonationHistory />} />
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
        <Route path="status" element={<RescueTeamStatus />} />
      </Route>
    </Routes>
  );
}