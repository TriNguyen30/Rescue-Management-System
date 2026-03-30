import React, { useState } from "react";
import {
    LayoutDashboard,
    Users,
    Shield,
    Bell,
    Map,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Waves,
    AlertTriangle,
    BarChart3,
    Radio,
    HeartPulse,
    Menu,
    X,
    Receipt,
    ChartColumnBig
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import Logo from "@/assets/image/LogoV2.png";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NavItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number | string;
    section?: string;
}

interface AdminSidebarProps {
    activePage?: string;
    onNavigate?: (key: string) => void;
    adminName?: string;
    adminRole?: string;
    adminInitials?: string;
    onLogout?: () => void;
}

// ── Nav Config ────────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
    { key: "dashboard", label: "Tổng quan", icon: <LayoutDashboard className="w-4 h-4" />, path: "/admin", section: "Chính" },
    // { key: "rescue-map", label: "Bản đồ cứu hộ", icon: <Map className="w-4 h-4" />, path: "/admin/rescue-map", badge: "LIVE" },
    // { key: "alerts", label: "Cảnh báo", icon: <AlertTriangle className="w-4 h-4" />, path: "/admin/alerts", badge: 3 },
    // { key: "broadcasts", label: "Phát sóng", icon: <Radio className="w-4 h-4" />, path: "/admin/broadcasts" },

    { key: "users", label: "Người dùng", icon: <Users className="w-4 h-4" />, path: "/admin/users", section: "Quản lý" },
    // { key: "rescue-teams", label: "Đội cứu hộ", icon: <HeartPulse className="w-4 h-4" />, path: "/admin/rescue-teams" },
    // { key: "requests", label: "Yêu cầu cứu hộ", icon: <Bell className="w-4 h-4" />, path: "/admin/requests", badge: 12 },
    // { key: "reports", label: "Báo cáo", icon: <FileText className="w-4 h-4" />, path: "/admin/reports" },
    { key: "analytics", label: "Báo cáo cứu trợ", icon: <BarChart3 className="w-4 h-4" />, path: "/admin/analytics", section: "Phân tích" },
    { key: "revenue", label: "Doanh thu", icon: <ChartColumnBig className="w-4 h-4" />, path: "/admin/revenue"},
    { key: "settings", label: "Cài đặt", icon: <Settings className="w-4 h-4" />, path: "/admin/settings", section: "Hệ thống" },
];

// ── Badge ─────────────────────────────────────────────────────────────────────
function NavBadge({ value }: { value: number | string }) {
    const isLive = value === "LIVE";
    return (
        <span
            className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${isLive
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-500 text-white min-w-[18px] text-center"
                }`}
        >
            {value}
        </span>
    );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function AdminSidebar({
    // activePage = "users",
    // onNavigate,
    adminName = "Trần Quản Trị",
    adminRole = "ADMIN",
    adminInitials = "TQ",
}: AdminSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const location = useLocation();

    const displayName = user?.fullName || user?.username || adminName;
    const displayRole = user?.role || adminRole;
    const displayInitials =
        user && (user.fullName || user.username)
            ? (user.fullName || user.username)
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : adminInitials;

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
            className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? "w-[64px]" : "w-[240px]"
                }`}
        >
            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 ${collapsed ? "justify-center px-0" : ""}`}>
                <div className={`w-12 h-12 ${collapsed ? "mx-auto" : ""}`}>
                    <img src={Logo} alt="Logo" className="w-full h-auto" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <p className="text-sm font-extrabold text-gray-900 leading-tight truncate">Rescue AID</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Admin Panel</p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className={`ml-auto p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors shrink-0 cursor-pointer ${collapsed ? "hidden" : ""}`}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* Expand button when collapsed */}
            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.path;
                    const showSection = !collapsed && item.section;

                    return (
                        <React.Fragment key={item.key}>
                            {showSection && (
                                <p className="px-2 pt-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                    {item.section}
                                </p>
                            )}
                            <button
                                onClick={() => handleNav(item)}
                                title={collapsed ? item.label : undefined}
                                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                    } ${collapsed ? "justify-center" : ""}`}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                                )}

                                <span className={`shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                                    {item.icon}
                                </span>

                                {!collapsed && (
                                    <>
                                        <span className="truncate">{item.label}</span>
                                        {item.badge !== undefined && <NavBadge value={item.badge} />}
                                    </>
                                )}

                                {/* Tooltip for collapsed */}
                                {collapsed && (
                                    <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                                        {item.label}
                                        {item.badge !== undefined && (
                                            <span className="ml-1.5 text-[10px] bg-red-500 px-1 py-0.5 rounded-full">{item.badge}</span>
                                        )}
                                    </span>
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}
            </nav>

            {/* User Footer */}
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
                                <Shield className="w-3 h-3 text-red-500" />
                                <p className="text-xs text-red-600 font-medium">{displayRole}</p>
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
            {/* Desktop sidebar */}
            <div className="hidden md:flex sticky top-0 h-screen shrink-0 overflow-hidden">
                {sidebarContent}
            </div>

            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile drawer */}
            {mobileOpen && (
                <>
                    <div
                        className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="md:hidden fixed left-0 top-0 bottom-0 z-50 flex">
                        {/* Force full width on mobile, ignore collapsed */}
                        <div className="w-[240px] h-full bg-white border-r border-gray-100 flex flex-col shadow-2xl">
                            {/* Mobile close */}
                            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
                                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                    <Waves className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-extrabold text-gray-900 leading-tight">Rescue AID</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Admin Panel</p>
                                </div>
                                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                                {NAV_ITEMS.map((item) => {
                                    const isActive = location.pathname === item.path;

                                    return (
                                        <React.Fragment key={item.key}>
                                            {item.section && (
                                                <p className="px-2 pt-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                                                    {item.section}
                                                </p>
                                            )}
                                            <button
                                                onClick={() => handleNav(item)}   // 👈 sửa lại
                                                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all relative ${isActive
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                                    }`}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                                                )}
                                                <span
                                                    className={`shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"
                                                        }`}
                                                >
                                                    {item.icon}
                                                </span>
                                                <span className="truncate">{item.label}</span>
                                                {item.badge !== undefined && (
                                                    <NavBadge value={item.badge} />
                                                )}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                            </nav>

                            <div className="border-t border-gray-100 p-3">
                                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {displayInitials}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-semibold text-gray-800 truncate leading-tight">{displayName}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Shield className="w-3 h-3 text-red-500" />
                                            <p className="text-xs text-red-600 font-medium">{displayRole}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
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

// ── Layout Wrapper (optional usage example) ───────────────────────────────────
export function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}