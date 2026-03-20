import React, { useState } from "react";
import { ClipboardCheck, Shield, LogOut, ChevronLeft, ChevronRight, Waves, Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import Logo from "@/assets/image/LogoV2.png";

interface NavItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    path: string;
}

const NAV_ITEMS: NavItem[] = [
    { key: "tasks", label: "Nhiệm vụ", icon: <ClipboardCheck className="w-4 h-4" />, path: "/rescue-team" },
];

export default function RescueTeamSidebar() {
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem("rescue_sidebar_collapsed") === "true"
    );
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const displayName = user?.fullName || user?.username || "Đội cứu hộ";
    const displayRole = user?.role || "RESCUE_TEAM";
    const displayInitials =
        user && (user.fullName || user.username)
            ? (user.fullName || user.username)
                  .split(" ")
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
            : "DH";

    const toggleCollapsed = (value: boolean) => {
        setCollapsed(value);
        localStorage.setItem("rescue_sidebar_collapsed", String(value));
    };

    const handleNav = (item: NavItem) => {
        navigate(item.path);
        setMobileOpen(false);
    };

    const handleLogout = () => {
        try {
            dispatch(logout());
        } finally {
            navigate("/login");
        }
    };

    const sidebarContent = (
        <div
            className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ${
                collapsed ? "w-[64px]" : "w-[240px]"
            }`}
        >
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 ${collapsed ? "justify-center px-0" : ""}`}>
                <button
                    onClick={() => navigate("/")}
                    className={`flex items-center gap-3 min-w-0 ${collapsed ? "mx-auto" : ""}`}
                    title="Về trang chủ"
                >
                    <div className="w-12 h-12 shrink-0">
                        <img src={Logo} alt="Logo" className="w-full h-auto" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden text-left">
                            <p className="text-sm font-extrabold text-gray-900 leading-tight truncate">Rescue AID</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Rescue Team</p>
                        </div>
                    )}
                </button>

                {!collapsed && (
                    <button
                        onClick={() => toggleCollapsed(true)}
                        className="ml-auto p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors shrink-0 cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
            </div>

            {collapsed && (
                <button
                    onClick={() => toggleCollapsed(false)}
                    className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}

            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                    return (
                        <button
                            key={item.key}
                            onClick={() => handleNav(item)}
                            title={collapsed ? item.label : undefined}
                            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                                isActive ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                            } ${collapsed ? "justify-center" : ""}`}
                        >
                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />}
                            <span className={`shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                                {item.icon}
                            </span>
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            <div className={`border-t border-gray-100 p-3 ${collapsed ? "flex justify-center" : ""}`}>
                {collapsed ? (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center cursor-pointer" title={displayName}>
                        {displayInitials}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {displayInitials}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{displayName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Shield className="w-3 h-3 text-blue-500" />
                                <p className="text-xs text-blue-600 font-medium">{displayRole}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden md:flex sticky top-0 h-screen shrink-0 overflow-hidden">{sidebarContent}</div>

            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>

            {mobileOpen && (
                <>
                    <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="md:hidden fixed left-0 top-0 bottom-0 z-50 flex">
                        <div className="w-[240px] h-full bg-white border-r border-gray-100 flex flex-col shadow-2xl">
                            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
                                <button
                                    onClick={() => { navigate("/"); setMobileOpen(false); }}
                                    className="flex items-center gap-3 min-w-0"
                                    title="Về trang chủ"
                                >
                                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Waves className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-extrabold text-gray-900 leading-tight">Rescue AID</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Rescue Team</p>
                                    </div>
                                </button>
                                <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => handleNav(item)}
                                            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all relative ${
                                                isActive ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                            }`}
                                        >
                                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />}
                                            <span className={`shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}>{item.icon}</span>
                                            <span className="truncate">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="border-t border-gray-100 p-3">
                                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {displayInitials}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{displayName}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Shield className="w-3 h-3 text-blue-500" />
                                            <p className="text-xs text-blue-600 font-medium">{displayRole}</p>
                                        </div>
                                    </div>
                                    <button onClick={handleLogout} className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <LogOut className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}