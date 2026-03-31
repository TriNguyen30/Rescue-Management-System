import { Bell, Menu, X, LogOut, User, ChevronDown, Shield, ClipboardList, Receipt, Cross } from "lucide-react";
import { PiFirstAidFill } from "react-icons/pi";
import { useState, useRef, useEffect } from "react";
import { useNavigate, NavLink } from "react-router";
import Logo from "@/assets/image/LogoV2.png";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { API_BASE_URL } from "@/config/env";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/services/notification.service";

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
  const notifRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

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
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
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

  const resolvedAvatarUrl = (raw?: string | null) => {
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = String(API_BASE_URL || "").replace(/\/+$/, "");
    const path = String(raw).startsWith("/") ? raw : `/${raw}`;
    return base ? `${base}${path}` : raw;
  };

  const avatar = resolvedAvatarUrl((user as any)?.avatarUrl ?? (user as any)?.avatar ?? null);

  //Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifs.filter((n) => n.read === false).length;

  const refreshNotifications = async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const list = await getNotifications();
      setNotifs(list);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    // Load once on login and keep it light (poll every 60s)
    if (!user) {
      setNotifs([]);
      setNotifOpen(false);
      return;
    }
    refreshNotifications();
    const t = window.setInterval(() => refreshNotifications(), 60000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navigateWithScroll = (path: string) => {
    navigate(path);
    scrollToTop();
  };

  const goTo = (path: string) => {
    setMobileOpen(false);
    navigateWithScroll(path);
  };

  const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/map", label: "Bản đồ" },
    { to: "/contact", label: "Liên hệ" },
    { to: "/donate", label: "Quyên góp" },
  ];

  return (
    <header className={`sticky top-0 left-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm ${isScrolled ? "shadow-lg" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5">

          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => goTo("/")}>
            <div className="flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <img src={Logo} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-2 text-[16px] font-bold tracking-widest text-blue-400 uppercase">
                <PiFirstAidFill className="text-red-500 w-5 h-5" />
                Rescue AID
              </span>

              <span className="text-[12px] font-light text-gray-900 tracking-tight">
                Chung tay hỗ trợ lũ lụt
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}
                onClick={scrollToTop}
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
            <div ref={notifRef} className="relative">
              <button
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                title="Thông báo"
                onClick={async () => {
                  const next = !notifOpen;
                  setNotifOpen(next);
                  if (next) await refreshNotifications();
                }}
              >
                <Bell className="w-5 h-5 text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Thông báo</p>
                      <p className="text-[11px] text-gray-400">
                        {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Không có thông báo mới"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-gray-300 cursor-pointer"
                      disabled={notifs.length === 0 || unreadCount === 0}
                      onClick={async () => {
                        await markAllNotificationsRead();
                        setNotifs((p) => p.map((n) => ({ ...n, read: true })));
                      }}
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {notifLoading ? (
                      <div className="px-4 py-6 text-sm text-gray-500">Đang tải...</div>
                    ) : notifs.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500">Chưa có thông báo.</div>
                    ) : (
                      <div className="p-2">
                        {notifs.slice(0, 20).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors border border-transparent hover:bg-gray-50 cursor-pointer ${n.read === false ? "bg-blue-50/50" : ""}`}
                            onClick={async () => {
                              if (n.read === false) {
                                await markNotificationRead(n.id);
                                setNotifs((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                              }
                              if (n.link) navigateWithScroll(n.link);
                              setNotifOpen(false);
                            }}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read === false ? "bg-blue-600" : "bg-gray-200"}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {n.title ?? "Thông báo"}
                                </p>
                                {n.message && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                    {n.message}
                                  </p>
                                )}
                                {n.createdAt && (
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    {new Date(n.createdAt).toLocaleString("vi-VN")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              /* Profile Dropdown */
              <div ref={profileRef} className="relative hidden md:block">
                <button
                  onClick={() => { setProfileOpen(!profileOpen); }}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
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
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0 overflow-hidden">
                          {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
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
                        onClick={() => { goTo("/profile"); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4" /> Hồ sơ cá nhân
                      </button>
                      <button
                        onClick={() => { goTo("/requests-history"); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                      >
                        <ClipboardList className="w-4 h-4" /> Lịch sử cầu cứu
                      </button>
                      <button
                        onClick={() => { goTo("/donation-history"); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-4 h-4" /> Lịch sử quyên góp
                      </button>
                      <button
                        onClick={() => { handleLogout(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="hidden md:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Đăng nhập
              </NavLink>
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
        className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
        style={{ borderTop: "1px solid #f3f4f6" }}
      >
        <div className="px-4 py-3 space-y-1 bg-white">
          {navLinks.map(({ to, label }) => (
            <button key={to} onClick={() => { goTo(to); setMobileOpen(false); }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition">
              {label}
            </button>
          ))}

          <div className="pt-2 mt-1 border-t border-gray-100">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 mb-1 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || user.username}</p>
                    <p className="text-xs text-gray-400">{ROLE_LABELS[user.role] || user.role}</p>
                  </div>
                </div>
                <button onClick={() => { goTo("/profile"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <User className="w-4 h-4" /> Hồ sơ cá nhân
                </button>
                <button onClick={() => { goTo("/requests-history"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <ClipboardList className="w-4 h-4" /> Lịch sử cầu cứu
                </button>
                <button onClick={() => { goTo("/donation-history"); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <Receipt className="w-4 h-4" /> Lịch sử quyên góp
                </button>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </>
            ) : (
              <button onClick={() => { goTo("/login"); setMobileOpen(false); }}
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