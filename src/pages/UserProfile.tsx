import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { changePassword, updateMyProfile } from "@/services/user.service";
import { setUser } from "@/store/slices/authSlice";
import { API_BASE_URL } from "@/config/env";
import { ChangePasswordPayload } from "@/types/user";
import {
    User,
    Phone,
    Shield,
    KeyRound,
    Check,
    Loader2,
    AlertTriangle,
    Hash,
    CalendarDays,
    Eye,
    EyeOff,
    Lock,
    Pencil,
} from "lucide-react";

// ── Role meta ─────────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    ADMIN: { label: "Admin", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
    MANAGER: { label: "Manager", color: "text-purple-600", bg: "bg-purple-50", dot: "bg-purple-500" },
    COORDINATOR: { label: "Coordinator", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
    RESCUE_TEAM: { label: "Rescue Team", color: "text-orange-600", bg: "bg-orange-50", dot: "bg-orange-500" },
    CITIZEN: { label: "Citizen", color: "text-gray-600", bg: "bg-gray-100", dot: "bg-gray-400" },
};

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="flex items-center gap-4 px-6 py-4 group">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className={`text-sm font-semibold text-gray-800 truncate ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
            </div>
        </div>
    );
}

function PasswordInput({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
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
                    className="w-full pl-4 pr-10 py-3 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-blue-400 focus:bg-white transition-all placeholder-gray-300"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UserProfile() {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const [avatarEditing, setAvatarEditing] = useState(false);
    const [avatarSaving, setAvatarSaving] = useState(false);
    const [avatarError, setAvatarError] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarDraft, setAvatarDraft] = useState("");

    // Password change state
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState("");
    const [pwSuccess, setPwSuccess] = useState(false);

    if (!user) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm">Đang tải thông tin...</p>
            </div>
        </div>
    );

    const displayName = user.fullName || user.username || "Người dùng";
    const initials = displayName.split(" ").map((w: string) => w[0]).slice(-2).join("").toUpperCase();
    const roleMeta = ROLE_META[user.role] ?? ROLE_META.CITIZEN;

    const resolvedAvatarUrl = (raw?: string | null) => {
        if (!raw) return null;
        if (/^https?:\/\//i.test(raw)) return raw;
        const base = String(API_BASE_URL || "").replace(/\/+$/, "");
        const path = String(raw).startsWith("/") ? raw : `/${raw}`;
        return base ? `${base}${path}` : raw;
    };

    useEffect(() => {
        const next = (user.avatarUrl ?? user.avatar ?? null) as string | null;
        setAvatarUrl(next);
        setAvatarDraft(next ?? "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.avatarUrl, user.avatar]);

    const isValidAvatarLink = (value: string) => {
        const v = value.trim();
        if (!v) return true; // allow clearing avatar
        if (v.startsWith("/")) return true; // allow relative path from API
        try {
            const u = new URL(v);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    };

    const handleSaveAvatarLink = async () => {
        setAvatarError("");
        const next = avatarDraft.trim();
        if (!isValidAvatarLink(next)) {
            setAvatarError("Link avatar không hợp lệ. Vui lòng dùng http(s)://... hoặc đường dẫn bắt đầu bằng /");
            return;
        }

        setAvatarSaving(true);
        try {
            // Optimistic UI
            setAvatarUrl(next || null);

            const updated = await updateMyProfile({ avatarUrl: next || null, avatar: next || null });
            const serverAvatar = ((updated?.avatarUrl ?? updated?.avatar ?? next) || null) as string | null;

            dispatch(setUser({ ...user, avatarUrl: serverAvatar, avatar: serverAvatar }));
            setAvatarUrl(serverAvatar);
            setAvatarDraft(serverAvatar ?? "");
            setAvatarEditing(false);
        } catch (e: any) {
            setAvatarError(e?.response?.data?.message || e?.message || "Không thể cập nhật avatar. Vui lòng thử lại.");
            const current = (user.avatarUrl ?? user.avatar ?? null) as string | null;
            setAvatarUrl(current);
            setAvatarDraft(current ?? "");
        } finally {
            setAvatarSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPwError("");
        setPwSuccess(false);

        if (!oldPassword || !newPassword || !confirmPassword) {
            setPwError("Vui lòng điền đầy đủ tất cả các trường.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError("Mật khẩu mới và xác nhận không khớp.");
            return;
        }
        if (newPassword.length < 6) {
            setPwError("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }

        setPwSaving(true);
        try {
            const payload: ChangePasswordPayload = { oldPassword, newPassword };
            await changePassword(payload);
            setPwSuccess(true);
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPwSuccess(false), 4000);
        } catch (e: any) {
            setPwError(e?.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
        } finally {
            setPwSaving(false);
        }
    };

    const createdAt = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
        : null;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .profile-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
        .fade-up-2 { animation: fadeUp .4s cubic-bezier(.22,1,.36,1) .08s both; }
        .fade-up-3 { animation: fadeUp .4s cubic-bezier(.22,1,.36,1) .16s both; }
      `}</style>

            <div className="profile-root min-h-screen bg-gray-50/80">
                {/* ── Top hero banner ── */}
                <div className="relative bg-white border-b border-gray-100 overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.06]"
                        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
                    <div className="absolute -bottom-8 left-24 w-40 h-40 rounded-full opacity-[0.05]"
                        style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

                    <div className="relative max-w-3xl mx-auto px-6 py-10 fade-up">
                        <div className="flex items-center gap-6">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200 overflow-hidden">
                                    {resolvedAvatarUrl(avatarUrl) ? (
                                        <img
                                            src={resolvedAvatarUrl(avatarUrl) ?? undefined}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${roleMeta.dot}`} />
                                <button
                                    type="button"
                                    onClick={() => { setAvatarEditing((v) => !v); setAvatarError(""); }}
                                    disabled={avatarSaving}
                                    className="absolute -top-2 -right-2 w-9 h-9 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                    title="Đổi avatar"
                                >
                                    {avatarSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Name + role */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-black text-gray-900 leading-tight truncate">{displayName}</h1>
                                {/* <p className="text-sm text-gray-400 font-medium mt-0.5">@{user.username}</p> */}
                                {avatarEditing && (
                                    <div className="mt-3 max-w-xl">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <input
                                                value={avatarDraft}
                                                onChange={(e) => setAvatarDraft(e.target.value)}
                                                placeholder="Dán link avatar (https://...)"
                                                className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-blue-400 focus:bg-white transition-all placeholder-gray-300"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveAvatarLink}
                                                    disabled={avatarSaving}
                                                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {avatarSaving ? "Đang lưu..." : "Lưu"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAvatarEditing(false);
                                                        setAvatarError("");
                                                        const current = (user.avatarUrl ?? user.avatar ?? null) as string | null;
                                                        setAvatarDraft(current ?? "");
                                                        setAvatarUrl(current);
                                                    }}
                                                    disabled={avatarSaving}
                                                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                        {avatarError && (
                                            <div className="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-2xl inline-flex items-center gap-2">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span>{avatarError}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleMeta.bg} ${roleMeta.color} border-current/20`}>
                                        <Shield className="w-3 h-3" />
                                        {roleMeta.label}
                                    </span>
                                    {user.userCode && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 font-mono">
                                            <Hash className="w-3 h-3" />
                                            {user.userCode}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quick stat */}
                            {createdAt && (
                                <div className="hidden sm:flex flex-col items-end shrink-0">
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tham gia</p>
                                    <p className="text-sm font-bold text-gray-700">{createdAt}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

                    {/* ── Personal info card ── */}
                    <SectionCard className="fade-up-2">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800">Thông tin cá nhân</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {avatarError && (
                                    <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                                        {avatarError}
                                    </span>
                                )}
                                {!avatarError && avatarSaving && (
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                                        Đang cập nhật avatar...
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            <InfoRow
                                icon={<User className="w-4 h-4" />}
                                label="Họ và tên"
                                value={displayName}
                            />
                            {/* <InfoRow
                                icon={<User className="w-4 h-4" />}
                                label="Tên đăng nhập"
                                value={`@${user.username}`}
                                mono
                            /> */}
                            <InfoRow
                                icon={<Phone className="w-4 h-4" />}
                                label="Số điện thoại"
                                value={user.phone}
                            />
                            <InfoRow
                                icon={<Shield className="w-4 h-4" />}
                                label="Vai trò"
                                value={
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-lg ${roleMeta.bg} ${roleMeta.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${roleMeta.dot}`} />
                                        {roleMeta.label}
                                    </span>
                                }
                            />
                            <InfoRow
                                icon={<Hash className="w-4 h-4" />}
                                label="Mã người dùng"
                                value={user.userCode}
                                mono
                            />
                            {createdAt && (
                                <InfoRow
                                    icon={<CalendarDays className="w-4 h-4" />}
                                    label="Ngày tạo tài khoản"
                                    value={createdAt}
                                />
                            )}
                        </div>
                    </SectionCard>

                    {/* ── Change password card ── */}
                    <SectionCard className="fade-up-3">
                        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
                            <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
                                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-800">Đổi mật khẩu</h2>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <PasswordInput
                                label="Mật khẩu hiện tại"
                                value={oldPassword}
                                onChange={setOldPassword}
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                            <PasswordInput
                                label="Mật khẩu mới"
                                value={newPassword}
                                onChange={setNewPassword}
                                placeholder="Ít nhất 6 ký tự"
                            />
                            <PasswordInput
                                label="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                placeholder="Nhập lại mật khẩu mới"
                            />

                            {/* Strength hint */}
                            {newPassword.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((i) => {
                                            const strength = newPassword.length >= 12 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1;
                                            return (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength
                                                        ? strength >= 4 ? "bg-emerald-400"
                                                            : strength >= 3 ? "bg-blue-400"
                                                                : strength >= 2 ? "bg-amber-400"
                                                                    : "bg-red-400"
                                                        : "bg-gray-100"
                                                    }`} />
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                        {newPassword.length < 6 ? "Quá ngắn" : newPassword.length < 8 ? "Yếu" : newPassword.length < 12 ? "Trung bình" : "Mạnh"}
                                    </p>
                                </div>
                            )}

                            {/* Error / success */}
                            {pwError && (
                                <div className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{pwError}</span>
                                </div>
                            )}
                            {pwSuccess && (
                                <div className="flex items-center gap-2.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-2xl">
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span className="font-semibold">Đổi mật khẩu thành công!</span>
                                </div>
                            )}

                            <button
                                onClick={handleChangePassword}
                                disabled={pwSaving}
                                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                            >
                                {pwSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                                ) : (
                                    <><Lock className="w-4 h-4" /> Cập nhật mật khẩu</>
                                )}
                            </button>
                        </div>
                    </SectionCard>

                    {/* ── Security note ── */}
                    <p className="text-center text-xs text-gray-400 pb-4">
                        Thông tin tài khoản được bảo mật · Rescue AID
                    </p>
                </div>
            </div>
        </>
    );
}