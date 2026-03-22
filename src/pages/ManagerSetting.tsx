import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings,
  User,
  Shield,
  KeyRound,
  Phone,
  Mail,
  Hash,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Bell,
  MapPin,
} from "lucide-react";
import { ManagerLayout } from "@/components/ui/ManagerSidebar";
import { useAppSelector } from "@/store/hooks";
import { changePassword } from "@/services/user.service";
import type { ChangePasswordPayload } from "@/types/user";
import { useToast } from "@/components/ui/Toast";

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Quản lý",
  ADMIN: "Quản trị viên",
  COORDINATOR: "Điều phối",
  RESCUE_TEAM: "Đội cứu hộ",
  CITIZEN: "Công dân",
};

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pl-4 pr-10 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ManagerSetting() {
  const { user } = useAppSelector((s) => s.auth);
  const { success, error: toastError } = useToast();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwOk(false);
    if (!oldPassword || !newPassword) {
      setPwError("Vui lòng nhập đủ mật khẩu cũ và mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Mật khẩu mới nên có ít nhất 6 ký tự.");
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({ oldPassword, newPassword } as ChangePasswordPayload);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwOk(true);
      success("Đổi mật khẩu thành công", "Vui lòng đăng nhập lại nếu bị yêu cầu.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Đổi mật khẩu thất bại.";
      setPwError(msg);
      toastError("Có lỗi", msg);
    } finally {
      setPwSaving(false);
    }
  };

  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : "—";

  return (
    <ManagerLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cài đặt</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Tài khoản quản lý, bảo mật và lối tắt trong hệ thống
              </p>
            </div>
          </div>

          {/* Account */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Tài khoản</h2>
            </div>
            <div className="p-5 space-y-4">
              {!user ? (
                <p className="text-sm text-gray-500">Chưa đăng nhập hoặc không có thông tin người dùng.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <User className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase">Họ tên</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName || user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Shield className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase">Vai trò</p>
                      <p className="text-sm font-semibold text-gray-900">{roleLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase">Email</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{user.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase">Điện thoại</p>
                      <p className="text-sm font-medium text-gray-800">{user.phone || "—"}</p>
                    </div>
                  </div>
                  {user.userCode && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 sm:col-span-2">
                      <Hash className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase">Mã người dùng</p>
                        <p className="text-sm font-mono font-medium text-gray-800">{user.userCode}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Password */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Bảo mật</h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              <PasswordField label="Mật khẩu hiện tại" value={oldPassword} onChange={setOldPassword} />
              <PasswordField
                label="Mật khẩu mới"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordField
                label="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />

              {pwError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {pwError}
                </div>
              )}
              {pwOk && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                  <Check className="w-4 h-4 shrink-0" />
                  Mật khẩu đã được cập nhật.
                </div>
              )}

              <button
                type="submit"
                disabled={pwSaving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 rounded-xl transition-colors"
              >
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {pwSaving ? "Đang lưu..." : "Đổi mật khẩu"}
              </button>
            </form>
          </section>

          {/* Shortcuts */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Lối tắt</h2>
            </div>
            <ul className="divide-y divide-gray-50">
              <li>
                <Link
                  to="/manager"
                  className="flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">Tổng quan</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/rescue-map"
                  className="flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">Bản đồ cứu hộ</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/requests"
                  className="flex items-center justify-between px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">Yêu cầu cứu hộ</span>
                  <Bell className="w-4 h-4 text-gray-400" />
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </ManagerLayout>
  );
}
