import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { createRescueRequest } from "@/services/rescue-request.service";
import { uploadFile } from "@/services/upload.service";
import {
    Camera,
    X,
    MapPin,
    Wifi,
    WifiOff,
    Loader2,
    Send,
    AlertTriangle,
    CheckCircle2,
    RotateCcw,
    ArrowLeft,
    ShieldAlert,
    SatelliteDish,
    ImagePlus,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface UploadedImage {
    id: string;
    file: File;
    url: string;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RescueRequestPage() {
    const { user: citizen } = useAppSelector((state) => state.auth);
    const [step, setStep] = useState<"form" | "success" | "error" | "offline">("form");
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [gpsLoading, setGpsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [requestId, setRequestId] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        description: "",
        lat: null as number | null,
        lng: null as number | null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!navigator.geolocation) {
            setForm((f) => ({ ...f, lat: 10.7769, lng: 106.7009 }));
            setGpsLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
                setGpsLoading(false);
            },
            () => {
                setForm((f) => ({ ...f, lat: 10.7769, lng: 106.7009 }));
                setGpsLoading(false);
            }
        );
    }, []);

    useEffect(() => {
        const h = () => setIsOnline(navigator.onLine);
        window.addEventListener("online", h);
        window.addEventListener("offline", h);
        return () => { window.removeEventListener("online", h); window.removeEventListener("offline", h); };
    }, []);

    const displayName = citizen?.fullName ?? citizen?.username ?? "Người dùng";
    const initials = displayName.split(" ").map((w: string) => w[0]).slice(-2).join("").toUpperCase();

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.description.trim()) e.description = "Vui lòng mô tả tình huống";
        if (form.lat == null || form.lng == null) e.gps = "Đang chờ tọa độ GPS...";
        return e;
    };

    const handleSubmit = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        if (!isOnline) { setStep("offline"); return; }
        if (form.lat == null || form.lng == null) return;

        setSubmitting(true);
        setErrorMessage("");
        try {
            const imagePaths: string[] = [];
            for (const img of uploadedImages) {
                const res = await uploadFile(img.file);
                const data = res.data as { path?: string; url?: string; data?: { path?: string } };
                const path = data?.path ?? data?.url ?? data?.data?.path;
                if (typeof path === "string") imagePaths.push(path);
            }
            const result = await createRescueRequest({
                description: form.description.trim(),
                latitude: form.lat,
                longitude: form.lng,
                images: imagePaths.length > 0 ? imagePaths : undefined,
            });
            const resData = result as { data?: { _id?: string; id?: string }; _id?: string; id?: string };
            const id = resData?.data?._id ?? resData?.data?.id ?? resData?._id ?? resData?.id;
            setRequestId(id ? String(id) : "—");
            setStep("success");
        } catch (err: unknown) {
            const msg = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : err instanceof Error ? err.message : "Không thể gửi yêu cầu.";
            setErrorMessage(typeof msg === "string" ? msg : "Đã xảy ra lỗi");
            setStep("error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageDrop = (files: FileList | null) => {
        if (!files?.length) return;
        const newImages: UploadedImage[] = Array.from(files).map((f) => ({
            id: Math.random().toString(36).slice(2),
            file: f,
            url: URL.createObjectURL(f),
        }));
        setUploadedImages((p) => [...p, ...newImages].slice(0, 5));
    };

    const removeImage = (id: string) => {
        setUploadedImages((p) => {
            const img = p.find((i) => i.id === id);
            if (img) URL.revokeObjectURL(img.url);
            return p.filter((i) => i.id !== id);
        });
    };

    const field = (key: keyof typeof form, value: string | number | null) => {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => { const c = { ...e }; delete c[key]; return c; });
    };

    const resetForm = () => {
        setStep("form");
        setForm((f) => ({ description: "", lat: f.lat ?? 10.7769, lng: f.lng ?? 106.7009 }));
        setUploadedImages((p) => { p.forEach((i) => URL.revokeObjectURL(i.url)); return []; });
        setErrors({});
        setErrorMessage("");
    };

    // ── OFFLINE ─────────────────────────────────────────────────────────────
    if (step === "offline") return (
        <PageShell>
            <StatusCard
                icon={<WifiOff className="w-10 h-10 text-amber-400" />}
                iconBg="bg-amber-400/10 border-amber-400/20"
                title="Không có kết nối mạng"
                titleColor="text-amber-400"
                subtitle="Vui lòng kết nối Internet để gửi yêu cầu cứu hộ"
            >
                <div className="w-full bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 text-sm text-amber-300 text-center">
                    Yêu cầu chỉ có thể gửi khi đang online. Hãy thử lại khi có mạng.
                </div>
                <button onClick={resetForm} className="btn-secondary mt-2">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
            </StatusCard>
        </PageShell>
    );

    // ── ERROR ────────────────────────────────────────────────────────────────
    if (step === "error") return (
        <PageShell>
            <StatusCard
                icon={<AlertTriangle className="w-10 h-10 text-red-400" />}
                iconBg="bg-red-400/10 border-red-400/20"
                title="Gửi thất bại"
                titleColor="text-red-400"
                subtitle={errorMessage}
            >
                <button onClick={resetForm} className="btn-primary w-full">
                    <RotateCcw className="w-4 h-4" /> Thử lại
                </button>
                <button onClick={resetForm} className="btn-secondary">
                    <ArrowLeft className="w-4 h-4" /> Quay lại form
                </button>
            </StatusCard>
        </PageShell>
    );

    // ── SUCCESS ──────────────────────────────────────────────────────────────
    if (step === "success") return (
        <PageShell>
            <StatusCard
                icon={
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 relative" />
                    </div>
                }
                iconBg="bg-emerald-400/10 border-emerald-400/20"
                title="Gửi thành công!"
                titleColor="text-emerald-400"
                subtitle="Vui lòng chờ xác nhận từ đội cứu hộ"
            >
                <div className="w-full rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/10">
                    {[
                        { label: "Mã yêu cầu", value: <span className="font-mono text-blue-300">#{requestId}</span> },
                        { label: "Người gửi", value: displayName },
                        { label: "SĐT liên hệ", value: citizen?.phone ?? "—" },
                        { label: "Trạng thái", value: <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">Chờ xác nhận</span> },
                        { label: "Tọa độ", value: `${form.lat?.toFixed(4)}, ${form.lng?.toFixed(4)}` },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center px-4 py-3 bg-white/5">
                            <span className="text-sm text-slate-400">{label}</span>
                            <span className="text-sm font-semibold text-slate-100">{value}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 text-center">Thông báo đã được gửi tới Rescue Coordinator</p>
                <button onClick={resetForm} className="btn-primary w-full">
                    <Send className="w-4 h-4" /> Tạo yêu cầu mới
                </button>
            </StatusCard>
        </PageShell>
    );

    // ── MAIN FORM ────────────────────────────────────────────────────────────
    return (
        <PageShell>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        .rescue-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .btn-primary { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:14px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-weight:800;font-size:14px;border:none;cursor:pointer;transition:all .2s;box-shadow:0 4px 20px rgba(239,68,68,0.35);font-family:'DM Sans',sans-serif; }
        .btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 28px rgba(239,68,68,0.45);}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
        .btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 20px;border-radius:12px;background:rgba(255,255,255,0.07);color:#94a3b8;border:1px solid rgba(255,255,255,0.1);font-weight:600;font-size:13px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif;}
        .btn-secondary:hover{background:rgba(255,255,255,0.12);color:#cbd5e1;}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}
        .slide-up{animation:slideUp .45s cubic-bezier(.22,1,.36,1) both;}
        .slide-up-2{animation:slideUp .45s cubic-bezier(.22,1,.36,1) .08s both;}
        .slide-up-3{animation:slideUp .45s cubic-bezier(.22,1,.36,1) .16s both;}
        .slide-up-4{animation:slideUp .45s cubic-bezier(.22,1,.36,1) .24s both;}
        textarea:focus,input:focus{outline:none;}
      `}</style>

            <div className="rescue-root w-full max-w-[640px] mx-auto px-4 py-6 space-y-4">

                {/* ── Header card ── */}
                <div className="slide-up rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                    {/* Top strip */}
                    <div className="flex items-center justify-between px-5 py-3 bg-red-500/10 border-b border-red-500/20">
                        <div className="flex items-center gap-2.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                            </span>
                            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Hệ thống khẩn cấp · Rescue AID</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isOnline ? "text-emerald-400" : "text-red-400"}`}>
                            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                            {isOnline ? "Online" : "Offline"}
                        </div>
                    </div>

                    <div className="px-5 py-4 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                                Gửi Yêu Cầu<br />
                                <span className="text-red-400">Cứu Hộ</span>
                            </h1>
                            <p className="text-xs text-slate-400 mt-1.5 font-medium">Chung Tay Vượt Lũ · Phản hồi trong vòng 15 phút</p>
                        </div>
                        {/* User badge */}
                        <div className="flex items-center gap-3 shrink-0 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-black shrink-0">
                                {initials}
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-100 leading-tight max-w-[100px] truncate">{displayName}</p>
                                <p className="text-[11px] text-slate-500 leading-tight">{citizen?.phone ?? citizen?.username ?? "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* GPS strip */}
                    <div className="mx-4 mb-4 flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
                        {gpsLoading ? (
                            <>
                                <SatelliteDish className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                                <span className="text-xs text-blue-400 font-semibold">Đang lấy tọa độ GPS...</span>
                                <Loader2 className="w-3 h-3 text-blue-400 animate-spin ml-auto" />
                            </>
                        ) : (
                            <>
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="text-xs text-emerald-400 font-semibold font-mono">
                                    {form.lat?.toFixed(5)}, {form.lng?.toFixed(5)}
                                </span>
                                <span className="ml-auto text-[11px] text-slate-500 bg-white/5 rounded-md px-1.5 py-0.5">±5m</span>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Description ── */}
                <div className="slide-up-2 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <label className="text-sm font-bold text-slate-100">Mô tả tình huống <span className="text-red-400">*</span></label>
                    </div>
                    <textarea
                        rows={4}
                        style={{ resize: "vertical" }}
                        placeholder="Ví dụ: Nhà bị ngập 1.5m, có 3 người già và 2 trẻ em. Không có thuyền, nước đang dâng nhanh..."
                        value={form.description}
                        onChange={(e) => field("description", e.target.value)}
                        className={`w-full rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 placeholder-slate-500 bg-white/5 border transition-all duration-200 leading-relaxed
              ${errors.description
                                ? "border-red-500/60 bg-red-500/5 focus:border-red-400"
                                : "border-white/10 focus:border-blue-400/60 focus:bg-white/8"
                            }`}
                    />
                    <div className="flex justify-between items-center">
                        {errors.description
                            ? <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.description}</span>
                            : <span />}
                        <span className={`text-xs font-mono ${form.description.length > 450 ? "text-amber-400" : "text-slate-600"}`}>
                            {form.description.length}/500
                        </span>
                    </div>
                </div>

                {/* ── Image upload ── */}
                <div className="slide-up-3 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-slate-400" />
                            <label className="text-sm font-bold text-slate-100">Ảnh hiện trường</label>
                        </div>
                        <span className="text-xs text-slate-500 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                            {uploadedImages.length}/5 ảnh
                        </span>
                    </div>

                    {/* Drop zone */}
                    <div
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageDrop(e.dataTransfer.files); }}
                        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 py-8
              ${dragOver
                                ? "border-blue-400/70 bg-blue-400/10"
                                : "border-white/15 bg-white/3 hover:border-white/25 hover:bg-white/6"
                            }`}
                    >
                        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleImageDrop(e.target.files)} />
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${dragOver ? "bg-blue-400/20 border border-blue-400/40" : "bg-white/8 border border-white/15"}`}>
                            <Camera className={`w-6 h-6 transition-colors duration-200 ${dragOver ? "text-blue-300" : "text-slate-400"}`} />
                        </div>
                        <div className="text-center">
                            <p className={`text-sm font-semibold transition-colors duration-200 ${dragOver ? "text-blue-300" : "text-slate-300"}`}>
                                {dragOver ? "Thả ảnh vào đây" : "Nhấn hoặc kéo thả ảnh"}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">PNG, JPG · Tối đa 10MB mỗi ảnh</p>
                        </div>
                        {uploadedImages.length < 5 && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <ImagePlus className="w-3.5 h-3.5" />
                                Còn có thể thêm {5 - uploadedImages.length} ảnh
                            </div>
                        )}
                    </div>

                    {/* Image previews */}
                    {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-5 gap-2">
                            {uploadedImages.map((img) => (
                                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                                    <img src={img.url} alt={img.file.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                                        >
                                            <X className="w-3.5 h-3.5 text-white" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Submit ── */}
                <div className="slide-up-4 space-y-3">
                    {errors.gps && (
                        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-2.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {errors.gps}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || gpsLoading}
                        className="btn-primary w-full py-4 text-base rounded-2xl"
                    >
                        {submitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi yêu cầu...</>
                        ) : (
                            <><Send className="w-5 h-5" /> Gửi Yêu Cầu Cứu Hộ</>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-600">
                        Thông tin của bạn được bảo mật và chỉ dùng cho mục đích cứu hộ khẩn cấp
                    </p>
                </div>
            </div>
        </PageShell>
    );
}

// ── Layout shells ─────────────────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen w-full flex flex-col items-center"
            style={{
                background: "linear-gradient(160deg, #0a0f1e 0%, #0d1628 50%, #0a1020 100%)",
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Subtle grid overlay */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
            />
            {/* Red glow top */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
                style={{ background: "radial-gradient(ellipse at top, rgba(239,68,68,0.12) 0%, transparent 70%)" }} />

            <div className="relative w-full pb-16">
                {children}
            </div>
        </div>
    );
}

function StatusCard({
    icon, iconBg, title, titleColor, subtitle, children,
}: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    titleColor: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="max-w-md mx-auto mt-16 px-4">
            <div
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 flex flex-col items-center gap-5"
                style={{ animation: "slideUp .4s cubic-bezier(.22,1,.36,1) both" }}
            >
                <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
                <div className="text-center">
                    <h2 className={`text-2xl font-black ${titleColor}`}>{title}</h2>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{subtitle}</p>
                </div>
                <div className="w-full flex flex-col gap-3">{children}</div>
            </div>
        </div>
    );
}