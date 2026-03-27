import { Outlet } from "react-router-dom";
import ManagerSidebar from "@/components/ui/ManagerSidebar";

export default function ManagerLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <ManagerSidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">{<Outlet />}</main>
        </div>
    );
}
