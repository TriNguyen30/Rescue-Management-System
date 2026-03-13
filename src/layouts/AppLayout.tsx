import Navbar from "@/components/ui/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "@/components/ui/Footer";

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}