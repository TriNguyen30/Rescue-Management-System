import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Search, Trash2, Edit3, X, Check, ChevronDown,
  Shield, UserCheck, UserCog, Loader2, AlertTriangle,
  RefreshCw, Phone, Calendar, Hash, Lock
} from "lucide-react";
import {
  getUsers,
  deleteUser,
  patchUser,
  changePassword,
} from "@/services/user.service";
import { User, UpdateUserPayload, ChangePasswordPayload } from "@/types/user";
import { AdminLayout } from "@/components/ui/AdminSidebar";

const ROLES = ["CITIZEN", "RESCUE_TEAM", "COORDINATOR", "MANAGER", "ADMIN"];

const ROLE_META: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  ADMIN: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <Shield className="w-3 h-3" /> },
  MANAGER: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <UserCog className="w-3 h-3" /> },
  COORDINATOR: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <UserCheck className="w-3 h-3" /> },
  RESCUE_TEAM: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <Users className="w-3 h-3" /> },
  CITIZEN: { color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: <Users className="w-3 h-3" /> },
};

const RoleBadge = ({ role }: { role: string }) => {
  const meta = ROLE_META[role] ?? ROLE_META.CITIZEN;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.color}`}>
      {meta.icon} {role}
    </span>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (u: User) => void }) {
  const [tab, setTab] = useState<"info" | "password">("info");
  const [fullName, setFullName] = useState(user.fullName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState(user.role || "CITIZEN");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saveInfo = async () => {
    setSaving(true); setError("");
    try {
      const payload: UpdateUserPayload = { fullName, phone, role };
      const updated = await patchUser(payload);
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Cập nhật thất bại.");
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!oldPassword || !newPassword) { setError("Vui lòng điền đầy đủ."); return; }
    setSaving(true); setError("");
    try {
      const payload: ChangePasswordPayload = { oldPassword, newPassword };
      await changePassword(payload);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Đổi mật khẩu thất bại.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chỉnh sửa</p>
            <h3 className="text-lg font-bold text-gray-900">{user.fullName || user.username}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {(["info", "password"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={`py-3 mr-6 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t === "info" ? "Thông tin" : "Mật khẩu"}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === "info" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vai trò</label>
                <div className="relative">
                  <select value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu cũ</label>
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button onClick={tab === "info" ? saveInfo : savePassword} disabled={saving}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setDeleting(true); setError("");
    try {
      await deleteUser(user.id);
      onDeleted(user.id);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Xóa thất bại.");
    } finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Xóa người dùng?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Bạn có chắc muốn xóa <span className="font-semibold text-gray-700">{user.fullName || user.username}</span>? Hành động này không thể hoàn tác.
        </p>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Hủy</button>
          <button onClick={confirm} disabled={deleting}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors flex items-center justify-center gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────
function UserRow({ user, onEdit, onDelete }: { user: User; onEdit: (u: User) => void; onDelete: (u: User) => void }) {
  const initials = (user.fullName || user.username || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-orange-100 text-orange-700", "bg-purple-100 text-purple-700", "bg-pink-100 text-pink-700"];
  const colorIdx = user.username.charCodeAt(0) % colors.length;

  return (
    <tr className="group hover:bg-blue-50/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colors[colorIdx]}`}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user.fullName || "—"}</p>
            <p className="text-xs text-gray-400">@{user.username}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Hash className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-mono text-xs">{user.userCode || user.id || "—"}</span>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Phone className="w-3.5 h-3.5 text-gray-300" />
          {user.phone || <span className="text-gray-300">—</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-gray-300" />
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(user)}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors" title="Chỉnh sửa">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(user)}
            className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors" title="Xóa">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminUserDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tải danh sách người dùng.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.phone?.includes(q);
    return matchRole && matchSearch;
  });

  const stats = ROLES.map((r) => ({ role: r, count: users.filter((u) => u.role === r).length }));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
              <p className="text-sm text-gray-400 mt-0.5">Tổng cộng {users.length} tài khoản trong hệ thống</p>
            </div>
            </div>
            <button onClick={fetchUsers} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm self-start cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.map(({ role, count }) => {
              const meta = ROLE_META[role];
              return (
                <button key={role} onClick={() => setRoleFilter(roleFilter === role ? "ALL" : role)}
                  className={`p-4 rounded-2xl border text-left transition-all ${roleFilter === role ? `${meta.bg} ${meta.color} border-current shadow-sm` : "bg-white border-gray-100 hover:border-gray-200 text-gray-700"}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs font-medium mt-0.5 truncate">{role}</p>
                </button>
              );
            })}
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, username, số điện thoại..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="relative">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer">
                  <option value="ALL">Tất cả vai trò</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Đang tải dữ liệu...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-red-500">
                <AlertTriangle className="w-8 h-8" />
                <p className="text-sm">{error}</p>
                <button onClick={fetchUsers} className="text-xs text-blue-500 hover:underline">Thử lại</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-gray-400">
                <Users className="w-10 h-10 text-gray-200" />
                <p className="text-sm">Không tìm thấy người dùng nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Người dùng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Mã</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Điện thoại</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((user) => (
                      <UserRow key={user.id || user.username} user={user} onEdit={setEditUser} onDelete={setDeleteTarget} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            {!loading && !error && filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                Hiển thị {filtered.length} / {users.length} người dùng
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {editUser && (
          <EditModal user={editUser} onClose={() => setEditUser(null)}
            onSaved={(updated) => setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u))} />
        )}
        {deleteTarget && (
          <DeleteConfirm user={deleteTarget} onClose={() => setDeleteTarget(null)}
            onDeleted={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))} />
        )}
      </div>
    </AdminLayout>
  );
}