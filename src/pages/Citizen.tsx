import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { createRescueRequest } from "@/services/rescue-request.service";
import { uploadFile } from "@/services/upload.service";

// ── Types ───────────────────────────────────────────────────────────────────
interface UploadedImage {
    id: string;
    file: File;
    url: string;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RescueRequestPage() {
    const { user: citizen, token } = useAppSelector((state) => state.auth);
    const [step, setStep] = useState<"form" | "success" | "error" | "offline">("form");
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [gpsLoading, setGpsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [requestId, setRequestId] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        description: "",
        lat: null as number | null,
        lng: null as number | null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const canSendRequest = !!citizen && citizen.role === "CITIZEN";

    // GPS
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

    // Online/offline
    useEffect(() => {
        const h = () => setIsOnline(navigator.onLine);
        window.addEventListener("online", h);
        window.addEventListener("offline", h);
        return () => {
            window.removeEventListener("online", h);
            window.removeEventListener("offline", h);
        };
    }, []);

    const displayName = citizen?.fullName ?? citizen?.username ?? "Người dùng";
    const initials = displayName ? displayName.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase() : "??";

    const validate = (): Record<string, string> => {
        const e: Record<string, string> = {};
        if (!form.description.trim()) e.description = "Vui lòng mô tả tình huống";
        if (form.lat == null || form.lng == null) e.gps = "Đang chờ tọa độ GPS...";
        return e;
    };

    const handleSubmit = async () => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        if (!isOnline) {
            setStep("offline");
            return;
        }

        if (form.lat == null || form.lng == null) return;

        setSubmitting(true);
        setErrorMessage("");

        try {
            // Upload images
            const imagePaths: string[] = [];
            for (const img of uploadedImages) {
                const res = await uploadFile(img.file);
                const data = res.data as { path?: string; url?: string; data?: { path?: string } };
                const path = data?.path ?? data?.url ?? data?.data?.path;
                if (typeof path === "string") imagePaths.push(path);
            }

            const payload = {
                description: form.description.trim(),
                latitude: form.lat,
                longitude: form.lng,
                images: imagePaths.length > 0 ? imagePaths : undefined,
            };

            const result = await createRescueRequest(payload);
            const resData = result as { data?: { _id?: string; id?: string }; _id?: string; id?: string };
            const id = resData?.data?._id ?? resData?.data?.id ?? resData?._id ?? resData?.id;
            setRequestId(id ? String(id) : "—");
            setStep("success");
        } catch (err: unknown) {
            const msg = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : err instanceof Error ? err.message : "Không thể gửi yêu cầu. Vui lòng thử lại.";
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
        setErrors((e) => {
            const c = { ...e };
            delete c[key];
            return c;
        });
    };

    const resetForm = () => {
        setStep("form");
        setForm({ description: "", lat: form.lat ?? 10.7769, lng: form.lng ?? 106.7009 });
        setUploadedImages((p) => {
            p.forEach((i) => URL.revokeObjectURL(i.url));
            return [];
        });
        setErrors({});
        setErrorMessage("");
    };

    // ── OFFLINE ─────────────────────────────────────────────────────────────
    if (step === "offline")
        return (
            <Screen>
                <ResultCard>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>📴</div>
                    <h2 style={{ ...s.resultTitle, color: "#d97706" }}>Không có kết nối mạng</h2>
                    <p style={s.resultSub}>Vui lòng kết nối Internet để gửi yêu cầu cứu hộ</p>
                    <div style={s.offlineBox}>
                        <p style={{ margin: 0, fontSize: 14, color: "#92400e" }}>
                            Yêu cầu chỉ có thể gửi khi đang online. Hãy thử lại khi có mạng.
                        </p>
                    </div>
                    <button style={s.btnSecondary} onClick={resetForm}>
                        ← Quay lại
                    </button>
                </ResultCard>
            </Screen>
        );

    // ── ERROR ───────────────────────────────────────────────────────────────
    if (step === "error")
        return (
            <Screen>
                <ResultCard>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>❌</div>
                    <h2 style={{ ...s.resultTitle, color: "#dc2626" }}>Gửi thất bại</h2>
                    <p style={s.resultSub}>{errorMessage}</p>
                    <button style={s.btnPrimary} onClick={resetForm}>
                        Thử lại
                    </button>
                    <button style={{ ...s.btnSecondary, marginTop: 12 }} onClick={resetForm}>
                        ← Quay lại form
                    </button>
                </ResultCard>
            </Screen>
        );

    // ── SUCCESS ─────────────────────────────────────────────────────────────
    if (step === "success")
        return (
            <Screen>
                <ResultCard>
                    <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
                        <div style={s.successRing} />
                        <div style={{ fontSize: 56 }}>✅</div>
                    </div>
                    <h2 style={{ ...s.resultTitle, color: "#16a34a" }}>Gửi thành công!</h2>
                    <p style={s.resultSub}>Vui lòng chờ xác nhận từ đội cứu hộ</p>
                    <div style={s.successInfo}>
                        <InfoRow label="Mã yêu cầu" value={`#${requestId}`} />
                        <InfoRow label="Người gửi" value={displayName} />
                        <InfoRow label="SĐT liên hệ" value={citizen?.phone ?? "—"} />
                        <InfoRow label="Trạng thái" value={<Badge status="PENDING">Chờ xác nhận</Badge>} />
                        <InfoRow label="Tọa độ" value={`${form.lat?.toFixed(4)}, ${form.lng?.toFixed(4)}`} />
                    </div>
                    <p style={{ color: "#64748b", fontSize: 13, marginTop: 12, textAlign: "center" }}>Thông báo đã được gửi tới Rescue Coordinator</p>
                    <button style={s.btnPrimary} onClick={resetForm}>
                        Tạo yêu cầu mới
                    </button>
                </ResultCard>
            </Screen>
        );

    // ── MAIN FORM ───────────────────────────────────────────────────────────
    return (
        <Screen>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Be Vietnam Pro', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulsering { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        button:hover { filter: brightness(0.96); }
      `}</style>

            <div style={s.header}>
                <div style={s.headerTop}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={s.alertDot} />
                        <div>
                            <h1 style={s.title}>Gửi Yêu Cầu Cứu Hộ</h1>
                            <p style={s.subtitle}>Chung Tay Vượt Lũ · Hệ thống cứu hộ khẩn cấp</p>
                        </div>
                    </div>
                    <div style={s.userBadge}>
                        <div style={s.avatar}>{initials}</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e3a8a" }}>{displayName}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{citizen?.phone ?? citizen?.username ?? "—"}</div>
                        </div>
                    </div>
                </div>
                <div style={s.gpsStrip}>
                    {gpsLoading ? (
                        <>
                            <span style={s.spinner} />
                            <span style={{ color: "#2563eb" }}>Đang lấy tọa độ GPS...</span>
                        </>
                    ) : (
                        <>
                            <span>📍</span>
                            <span style={{ color: "#15803d", fontWeight: 600 }}>
                                GPS: {form.lat?.toFixed(4)}, {form.lng?.toFixed(4)}
                            </span>
                            <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>±5m</span>
                        </>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 4, fontSize: 12 }}>
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: isOnline ? "#22c55e" : "#ef4444",
                            display: "inline-block",
                        }}
                    />
                    <span style={{ color: isOnline ? "#15803d" : "#dc2626", fontWeight: 600 }}>
                        {isOnline ? "Đang online" : "Offline"}
                    </span>
                </div>
            </div>

            <div style={s.card}>
                <Section>
                    <label style={s.sectionTitle}>Mô tả tình huống *</label>
                    <textarea
                        style={{ ...inputSt(errors.description), minHeight: 100, resize: "vertical", fontFamily: "inherit" }}
                        placeholder="Ví dụ: Nhà bị ngập 1.5m, có 3 người già và 2 trẻ em. Không có thuyền, nước đang dâng nhanh..."
                        value={form.description}
                        onChange={(e) => field("description", e.target.value)}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        {errors.description ? <p style={{ ...s.error, margin: 0 }}>{errors.description}</p> : <span />}
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{form.description.length}/500</span>
                    </div>
                </Section>

                <Divider />

                <Section>
                    <label style={s.sectionTitle}>
                        Ảnh hiện trường <span style={{ color: "#94a3b8", fontWeight: 400 }}>(tối đa 5 ảnh)</span>
                    </label>
                    <div
                        style={{
                            border: `2px dashed ${dragOver ? "#2563eb" : "#cbd5e1"}`,
                            borderRadius: 14,
                            padding: "28px 20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: dragOver ? "#eff6ff" : "#f8fafc",
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            handleImageDrop(e.dataTransfer.files);
                        }}
                        onClick={() => fileRef.current?.click()}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                            onChange={(e) => handleImageDrop(e.target.files)}
                        />
                        <span style={{ fontSize: 32 }}>📷</span>
                        <span style={{ color: "#2563eb", fontWeight: 600, fontSize: 14 }}>Nhấn hoặc kéo thả ảnh vào đây</span>
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>PNG, JPG · Tối đa 10MB</span>
                    </div>
                    {uploadedImages.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                            {uploadedImages.map((img) => (
                                <div key={img.id} style={{ width: 80, height: 80, borderRadius: 10, overflow: "hidden", position: "relative", border: "2px solid #e2e8f0" }}>
                                    <img src={img.url} alt={img.file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <button
                                        type="button"
                                        style={{
                                            position: "absolute",
                                            top: 2,
                                            right: 2,
                                            background: "rgba(0,0,0,0.6)",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: 18,
                                            height: 18,
                                            fontSize: 9,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(img.id);
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                <Divider />

                <Section>
                    {errors.gps && <p style={s.error}>{errors.gps}</p>}
                    <button
                        type="button"
                        style={{
                            ...s.btnPrimary,
                            width: "100%",
                            fontSize: 16,
                            padding: "16px",
                            opacity: submitting || gpsLoading || !canSendRequest ? 0.6 : 1,
                            cursor: submitting || gpsLoading || !canSendRequest ? "not-allowed" : "pointer",
                        }}
                        onClick={handleSubmit}
                        disabled={submitting || gpsLoading || !canSendRequest}
                    >
                        {submitting ? (
                            <>
                                <span style={s.spinnerWhite} /> Đang gửi...
                            </>
                        ) : (
                            "Gửi yêu cầu cứu hộ"
                        )}
                    </button>
                    {!canSendRequest && (
                        <p style={{ textAlign: "center", fontSize: 12, color: "#dc2626", marginTop: 8 }}>
                            {token && citizen
                                ? "Chỉ tài khoản người dân (CITIZEN) mới có thể gửi yêu cầu cứu hộ."
                                : "Vui lòng đăng nhập bằng tài khoản người dân (CITIZEN) để gửi yêu cầu cứu hộ."}
                        </p>
                    )}
                    <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
                        Thông tin của bạn được bảo mật và chỉ dùng cho mục đích cứu hộ
                    </p>
                </Section>
            </div>
        </Screen>
    );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function Screen({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "24px 16px 60px", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulsering { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
            {children}
        </div>
    );
}

function Section({ children }: { children: React.ReactNode }) {
    return <div style={{ padding: "20px 24px" }}>{children}</div>;
}

function Divider() {
    return <div style={{ height: 1, background: "#e5e7eb" }} />;
}

function ResultCard({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                maxWidth: 440,
                margin: "60px auto",
                background: "#fff",
                borderRadius: 20,
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 4px 24px rgba(15,23,42,0.10)",
                border: "1px solid #e5e7eb",
                animation: "fadeIn 0.4s ease both",
            }}
        >
            {children}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value}</span>
        </div>
    );
}

function Badge({ status, children }: { status: string; children: React.ReactNode }) {
    const colors: Record<string, { bg: string; color: string }> = {
        PENDING: { bg: "#dbeafe", color: "#1d4ed8" },
        IN_PROGRESS: { bg: "#fef3c7", color: "#b45309" },
        DONE: { bg: "#dcfce7", color: "#15803d" },
    };
    const c = colors[status] ?? { bg: "#f1f5f9", color: "#475569" };
    return (
        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>
            {children}
        </span>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const inputSt = (err?: string) => ({
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`,
    fontSize: 14,
    color: "#1e293b",
    background: err ? "#fff5f5" : "#fff",
    outline: "none",
    transition: "border 0.2s",
    fontFamily: "'Be Vietnam Pro', sans-serif",
});

const s = {
    header: {
        maxWidth: 680,
        margin: "0 auto 16px",
        padding: "18px 20px 14px",
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 12px rgba(15,23,42,0.08)",
        animation: "fadeIn 0.4s ease both",
    },
    headerTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 },
    alertDot: {
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "#ef4444",
        flexShrink: 0,
        marginTop: 6,
        animation: "pulsering 1.4s infinite",
        boxShadow: "0 0 0 0 rgba(239,68,68,0.4)",
    },
    title: { margin: 0, fontSize: 22, fontWeight: 900, color: "#1e293b", lineHeight: 1.2 },
    subtitle: { margin: "4px 0 0", fontSize: 12, color: "#64748b" },
    userBadge: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#f8fafc",
        borderRadius: 12,
        padding: "8px 12px",
        border: "1px solid #e2e8f0",
        flexShrink: 0,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#2563eb",
        color: "#fff",
        fontWeight: 800,
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    gpsStrip: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#f8fafc",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 13,
        border: "1px solid #e2e8f0",
        color: "#475569",
        marginBottom: 6,
    },
    card: {
        maxWidth: 680,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 12px rgba(15,23,42,0.08)",
        animation: "fadeIn 0.5s ease 0.1s both",
        overflow: "hidden",
    },
    sectionTitle: { display: "block", fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 12 },
    label: { display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 },
    hint: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
    error: { color: "#ef4444", fontSize: 12, margin: "4px 0 0" },
    toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    toggle: (on: boolean) => ({
        width: 48,
        height: 26,
        borderRadius: 13,
        background: on ? "#2563eb" : "#cbd5e1",
        border: "none",
        cursor: "pointer",
        padding: 3,
        transition: "background 0.25s",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
    }),
    knob: (on: boolean) => ({
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "#fff",
        transition: "transform 0.25s",
        transform: on ? "translateX(22px)" : "translateX(0)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    }),
    onBehalfBox: {
        marginTop: 14,
        background: "#eff6ff",
        borderRadius: 12,
        padding: 16,
        border: "1px solid #bfdbfe",
    },
    counterBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        border: "1.5px solid #e2e8f0",
        background: "#f8fafc",
        fontSize: 20,
        fontWeight: 700,
        cursor: "pointer",
        color: "#1e3a8a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
    },
    counterVal: { width: 56, textAlign: "center" as const, fontSize: 22, fontWeight: 800, color: "#1e3a8a" },
    btnPrimary: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "12px 24px",
        borderRadius: 12,
        background: "#2563eb",
        color: "#fff",
        fontWeight: 800,
        fontSize: 14,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
        transition: "all 0.2s",
        fontFamily: "'Be Vietnam Pro', sans-serif",
    },
    btnSecondary: {
        marginTop: 16,
        padding: "10px 24px",
        borderRadius: 10,
        background: "#f1f5f9",
        color: "#475569",
        border: "none",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        fontFamily: "'Be Vietnam Pro', sans-serif",
    },
    spinner: {
        display: "inline-block",
        width: 12,
        height: 12,
        border: "2px solid #2563eb",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    spinnerWhite: {
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    resultTitle: { fontSize: 22, fontWeight: 900, margin: "0 0 6px" },
    resultSub: { color: "#64748b", fontSize: 14, margin: "0 0 20px", textAlign: "center" as const },
    successRing: {
        position: "absolute" as const,
        inset: -8,
        borderRadius: "50%",
        border: "3px solid #22c55e",
        animation: "pulsering 1.5s ease-out infinite",
    },
    successInfo: {
        width: "100%",
        background: "#f8fafc",
        borderRadius: 12,
        padding: "12px 16px",
        border: "1px solid #e2e8f0",
    },
    offlineBox: {
        background: "#fffbeb",
        border: "1px solid #fcd34d",
        borderRadius: 12,
        padding: "14px 16px",
        width: "100%",
    },
};
