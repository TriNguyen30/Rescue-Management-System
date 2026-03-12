import { Outlet } from "react-router-dom";
import RescueTeamSidebar from "@/components/ui/RescueTeamSidebar";

export default function RescueTeamLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <RescueTeamSidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">{<Outlet />}</main>
        </div>
    );
}
