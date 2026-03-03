import { Route, Routes } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Home from "@/pages/Citizen";
import Map from "@/pages/Map";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Contact from "@/pages/Contact";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "@/pages/AdminDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map/>} />
      </Route>
      <Route path="/Contact" element={<Contact/>} />
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
    </Routes>
  );
}
