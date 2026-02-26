import { Bell, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate, NavLink } from "react-router";
import DropdownMenu from "@/components/ui/Dropdown";
import Logo from "@/assets/image/Logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="relative top-0 left-0 w-full z-50"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
        borderBottom: "1px solid #bfdbfe",
        boxShadow: "0 2px 20px rgba(59,130,246,0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
              }}
            >
              <img src={Logo} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "#1d4ed8", letterSpacing: "0.12em" }}
              >
                Chung Tay
              </span>
              <span
                className="text-sm font-extrabold tracking-tight"
                style={{ color: "#1e3a8a" }}
              >
                Vượt Lũ
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center">

            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`
              }
            >
              Trang chủ
            </NavLink>

            <NavLink
              to="/map"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`
              }
            >
              Bản đồ
            </NavLink>

            <NavLink
              to="/tips"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`
              }
            >
              Liên hệ
            </NavLink>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <button
              className="relative p-2.5 rounded-xl transition-all duration-200 hover:bg-blue-50 group"
              style={{ border: "1px solid #d1fae5" }}
            >
              <Bell className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: "#3b82f6" }}
              >
                0
              </span>
            </button>

            {/* Auth Button */}
            <button
              onClick={() => navigate("/login")}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px active:translate-y-0"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
              }}
            >
              Đăng nhập
            </button>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-blue-50 transition"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        style={{ background: "#eff6ff", borderTop: "1px solid #bfdbfe" }}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          <button
            onClick={() => {
              navigate("/");
              setMobileOpen(false);
            }}
            className="text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
          >
            Trang chủ
          </button>
          <button
            onClick={() => {
              navigate("/map");
              setMobileOpen(false);
            }}
            className="text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
          >
            Bản đồ
          </button>
          <button
            onClick={() => {
              navigate("/contact");
              setMobileOpen(false);
            }}
            className="text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
          >
            Liên hệ
          </button>
          <div className="pt-2 border-t border-blue-100 mt-1">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              }}
            >
              Đăng nhập / Đăng ký
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
