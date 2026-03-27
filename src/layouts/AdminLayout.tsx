import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/ui/AdminSidebar";

export default function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">{<Outlet />}</main>
        </div>
    );
}
