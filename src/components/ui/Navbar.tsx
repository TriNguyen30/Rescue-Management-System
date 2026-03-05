import { Bell, Menu, X, LogOut, User, ChevronDown, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, NavLink } from "react-router";
import Logo from "@/assets/image/Logo.png";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý",
  COORDINATOR: "Điều phối",
  RESCUE_TEAM: "Đội cứu hộ",
  CITIZEN: "Người dùng",
};

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user
    ? (user.fullName || user.username || "?")
      .split(" ")
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "";

  const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/map", label: "Bản đồ" },
    { to: "/contact", label: "Liên hệ" },
  ];

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5">

          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <img src={Logo} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="leading-none">
              <span className="block text-[10px] font-bold tracking-widest text-blue-400 uppercase">Rescue</span>
              <span className="block text-sm font-extrabold text-gray-900 tracking-tight">AID</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Bell */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </button>

            {user ? (
              /* Profile Dropdown */
              <div ref={profileRef} className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="text-left leading-tight">
                    <p className="text-sm font-semibold text-gray-800 max-w-[100px] truncate">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-[10px] text-gray-400">{ROLE_LABELS[user.role] || user.role}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="leading-tight min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || user.username}</p>
                          {/* <p className="text-xs text-gray-400">@{user.username}</p> */}
                        </div>
                      </div>
                      <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                    {/* Menu items */}
                    <div className="p-1.5">
                      <button
                        onClick={() => { navigate("/profile"); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <User className="w-4 h-4" /> Hồ sơ cá nhân
                      </button>
                      <button
                        onClick={() => { handleLogout(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="hidden md:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        style={{ borderTop: "1px solid #f3f4f6" }}
      >
        <div className="px-4 py-3 space-y-1 bg-white">
          {navLinks.map(({ to, label }) => (
            <button key={to} onClick={() => { navigate(to); setMobileOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition">
              {label}
            </button>
          ))}

          <div className="pt-2 mt-1 border-t border-gray-100">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 mb-1 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || user.username}</p>
                    <p className="text-xs text-gray-400">{ROLE_LABELS[user.role] || user.role}</p>
                  </div>
                </div>
                <button onClick={() => { navigate("/profile"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <User className="w-4 h-4" /> Hồ sơ cá nhân
                </button>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </>
            ) : (
              <button onClick={() => { navigate("/login"); setMobileOpen(false); }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition">
                Đăng nhập / Đăng ký
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}