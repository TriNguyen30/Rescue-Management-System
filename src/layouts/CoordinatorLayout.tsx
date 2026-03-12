import { Outlet } from "react-router-dom";
import CoordinatorSidebar from "@/components/ui/CoordinatorSidebar";

export default function CoordinatorLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <CoordinatorSidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">{<Outlet />}</main>
        </div>
    );
}

