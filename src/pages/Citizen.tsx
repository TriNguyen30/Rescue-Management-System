import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "@/lib/axios";

// ── API helpers (mirrors your existing userService pattern) ─────────────────
const getCurrentUser = async () => {
  try {
    const res = await axiosInstance.get("/users/me");
    const body = res.data;
    const map = (item) => ({
      id: item.userCode || item.id || "",
      userCode: item.userCode || item.id || "",
      username: item.username || "",
      fullName: item.fullName || item.username || "Người dùng",
      phone: item.phone || "",
      role: item.role || "CITIZEN",
    });
    if (body && typeof body === "object" && "data" in body && body.data) return map(body.data);
    if (body && typeof body === "object") return map(body);
    return null;
  } catch {
    // Fallback for demo / unauthenticated
    return { id: "CTZ-001", userCode: "CTZ-001", username: "nguyenvana", fullName: "Nguyễn Văn An", phone: "0901234567", role: "CITIZEN" };
  }
};

// ── Constants ────────────────────────────────────────────────────────────────
const URGENCY_LEVELS = [
  { value: "LOW", label: "Nhẹ", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", desc: "Cần hỗ trợ nhưng không nguy hiểm tính mạng" },
  { value: "MEDIUM", label: "Trung bình", color: "#d97706", bg: "#fffbeb", border: "#fde68a", desc: "Cần được cứu trong vài giờ tới" },
  { value: "HIGH", label: "Khẩn cấp", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", desc: "Nguy hiểm tính mạng, cần cứu ngay" },
  { value: "CRITICAL", label: "Nguy kịch", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", desc: "Đe doạ tính mạng trực tiếp, cần heli/thuyền" },
];

const MOCK_EXISTING_REQUEST = null;
// const MOCK_EXISTING_REQUEST = { id: "RQ-0042", status: "IN_PROGRESS", createdAt: "2025-06-01T08:30:00" };

// ── Main Component ────────────────────────────────────────────────────────────
export default function RescueRequestPage() {
  const [step, setStep] = useState("form");
  const [onBehalf, setOnBehalf] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [citizen, setCitizen] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [requestCode, setRequestCode] = useState("");
  const fileRef = useRef();

  const [form, setForm] = useState({
    urgency: "",
    peopleCount: 1,
    description: "",
    victimName: "",
    victimPhone: "",
    lat: null,
    lng: null,
  });
  const [errors, setErrors] = useState({});

  // Fetch current user
  useEffect(() => {
    getCurrentUser().then((u) => {
      setCitizen(u);
      setUserLoading(false);
    });
  }, []);

  // Simulate GPS fetch
  useEffect(() => {
    const t = setTimeout(() => {
      setForm((f) => ({ ...f, lat: 10.7769, lng: 106.7009 }));
      setGpsLoading(false);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  // Online/offline
  useEffect(() => {
    const h = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", h);
    window.addEventListener("offline", h);
    return () => { window.removeEventListener("online", h); window.removeEventListener("offline", h); };
  }, []);

  const initials = citizen
    ? citizen.fullName.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase()
    : "??";

  const validate = () => {
    const e = {};
    if (!form.urgency) e.urgency = "Vui lòng chọn mức độ khẩn cấp";
    if (form.peopleCount < 1) e.peopleCount = "Số người phải lớn hơn 0";
    if (!form.description.trim()) e.description = "Vui lòng mô tả tình huống";
    if (onBehalf && !form.victimName.trim()) e.victimName = "Vui lòng nhập tên nạn nhân";
    if (onBehalf && !/^0\d{9}$/.test(form.victimPhone)) e.victimPhone = "Số điện thoại không hợp lệ";
    return e;
  };

  const handleSubmit = async () => {
    if (MOCK_EXISTING_REQUEST) { setStep("blocked"); return; }
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));

    if (!isOnline) { setStep("offline"); setSubmitting(false); return; }

    setRequestCode(`RQ-${Math.floor(Math.random() * 9000 + 1000)}`);
    setStep("success");
    setSubmitting(false);
  };

  const handleImageDrop = (files) => {
    const previews = Array.from(files).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      id: Math.random().toString(36).slice(2),
    }));
    setUploadedImages((p) => [...p, ...previews].slice(0, 5));
  };

  const field = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const c = { ...e }; delete c[key]; return c; });
  };

  const resetForm = () => {
    setStep("form");
    setForm({ urgency: "", peopleCount: 1, description: "", victimName: "", victimPhone: "", lat: 10.7769, lng: 106.7009 });
    setUploadedImages([]);
    setOnBehalf(false);
    setErrors({});
  };

  // ── BLOCKED ───────────────────────────────────────────────────────────────
  if (step === "blocked") return (
    <Screen>
      <ResultCard>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🚫</div>
        <h2 style={{ ...s.resultTitle, color: "#dc2626" }}>Yêu cầu bị từ chối</h2>
        <p style={s.resultSub}>Bạn đang có yêu cầu chưa hoàn tất</p>
        <div style={s.reqCard}>
          <Badge status="IN_PROGRESS">Đang xử lý</Badge>
          <span style={{ color: "#64748b", fontSize: 13, marginLeft: 8 }}>#{MOCK_EXISTING_REQUEST?.id}</span>
        </div>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 12, textAlign: "center" }}>
          Vui lòng chờ yêu cầu hiện tại hoàn tất trước khi tạo yêu cầu mới.
        </p>
        <button style={s.btnSecondary} onClick={resetForm}>← Quay lại</button>
      </ResultCard>
    </Screen>
  );

  // ── OFFLINE ───────────────────────────────────────────────────────────────
  if (step === "offline") return (
    <Screen>
      <ResultCard>
        <div style={{ fontSize: 56, marginBottom: 12 }}>📴</div>
        <h2 style={{ ...s.resultTitle, color: "#d97706" }}>Đã lưu ngoại tuyến</h2>
        <p style={s.resultSub}>Không có kết nối mạng</p>
        <div style={s.offlineBox}>
          <p style={{ margin: 0, fontSize: 14, color: "#92400e" }}>
            ✓ Yêu cầu đã được lưu vào bộ nhớ máy.<br />
            Sẽ tự động gửi khi có kết nối mạng.
          </p>
        </div>
        <button style={s.btnSecondary} onClick={resetForm}>← Quay lại</button>
      </ResultCard>
    </Screen>
  );

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (step === "success") return (
    <Screen>
      <ResultCard>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
          <div style={s.successRing} />
          <div style={{ fontSize: 56 }}>✅</div>
        </div>
        <h2 style={{ ...s.resultTitle, color: "#16a34a" }}>Gửi thành công!</h2>
        <p style={s.resultSub}>Vui lòng chờ xác nhận từ đội cứu hộ</p>
        <div style={s.successInfo}>
          <InfoRow label="Mã yêu cầu" value={`#${requestCode}`} />
          <InfoRow label="Người gửi" value={citizen?.fullName || "—"} />
          <InfoRow label="SĐT liên hệ" value={onBehalf ? form.victimPhone : (citizen?.phone || "—")} />
          <InfoRow label="Trạng thái" value={<Badge status="PENDING">Chờ xác nhận</Badge>} />
          <InfoRow label="Mức độ" value={URGENCY_LEVELS.find((u) => u.value === form.urgency)?.label} />
          <InfoRow label="Số người" value={`${form.peopleCount} người`} />
          <InfoRow label="Tọa độ" value={`${form.lat?.toFixed(4)}, ${form.lng?.toFixed(4)}`} />
        </div>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 12, textAlign: "center" }}>
          Thông báo đã được gửi tới Rescue Coordinator
        </p>
        <button style={s.btnPrimary} onClick={resetForm}>Tạo yêu cầu mới</button>
      </ResultCard>
    </Screen>
  );

  // ── MAIN FORM ─────────────────────────────────────────────────────────────
  return (
    <Screen>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Be Vietnam Pro', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulsering { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        button:hover { filter: brightness(0.96); }
      `}</style>

      {/* ── Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={s.alertDot} />
            <div>
              <h1 style={s.title}>🆘 Gửi Yêu Cầu Cứu Hộ</h1>
              <p style={s.subtitle}>Chung Tay Vượt Lũ · Hệ thống cứu hộ khẩn cấp</p>
            </div>
          </div>

          {/* User badge */}
          <div style={s.userBadge}>
            <div style={s.avatar}>{userLoading ? "…" : initials}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e3a8a" }}>
                {userLoading ? "Đang tải..." : (citizen?.fullName || "—")}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {userLoading ? "" : (citizen?.phone || citizen?.username || "—")}
              </div>
            </div>
          </div>
        </div>

        {/* GPS strip */}
        <div style={s.gpsStrip}>
          {gpsLoading ? (
            <><span style={s.spinner} /><span style={{ color: "#2563eb" }}>Đang lấy tọa độ GPS...</span></>
          ) : (
            <>
              <span>📍</span>
              <span style={{ color: "#15803d", fontWeight: 600 }}>
                GPS: {form.lat?.toFixed(4)}, {form.lng?.toFixed(4)}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>TP. Hồ Chí Minh · ±5m</span>
            </>
          )}
        </div>

        {/* Online indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 4, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#22c55e" : "#ef4444", display: "inline-block" }} />
          <span style={{ color: isOnline ? "#15803d" : "#dc2626", fontWeight: 600 }}>
            {isOnline ? "Đang online" : "Offline – sẽ lưu cục bộ"}
          </span>
          <button
            onClick={() => setIsOnline((v) => !v)}
            style={{ marginLeft: "auto", fontSize: 10, color: "#94a3b8", background: "none", border: "1px solid #e2e8f0", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}
          >
            Demo toggle
          </button>
        </div>
      </div>

      {/* ── Card */}
      <div style={s.card}>

        {/* On behalf toggle */}
        <Section>
          <div style={s.toggleRow}>
            <div>
              <div style={s.sectionTitle}>Báo hộ người khác?</div>
              <div style={s.hint}>Chọn nếu bạn đang báo thay cho nạn nhân khác</div>
            </div>
            <button style={s.toggle(onBehalf)} onClick={() => setOnBehalf((v) => !v)}>
              <div style={s.knob(onBehalf)} />
            </button>
          </div>

          {onBehalf && (
            <div style={s.onBehalfBox}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Tên nạn nhân *</label>
                  <input style={inputSt(errors.victimName)} placeholder="Nguyễn Văn B" value={form.victimName} onChange={(e) => field("victimName", e.target.value)} />
                  {errors.victimName && <p style={s.error}>{errors.victimName}</p>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>SĐT nạn nhân *</label>
                  <input style={inputSt(errors.victimPhone)} placeholder="0901234567" value={form.victimPhone} onChange={(e) => field("victimPhone", e.target.value)} />
                  {errors.victimPhone && <p style={s.error}>{errors.victimPhone}</p>}
                </div>
              </div>
            </div>
          )}
        </Section>

        <Divider />

        {/* Urgency */}
        <Section>
          <label style={s.sectionTitle}>Mức độ khẩn cấp *</label>
          {errors.urgency && <p style={s.error}>{errors.urgency}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {URGENCY_LEVELS.map((u) => {
              const active = form.urgency === u.value;
              return (
                <button
                  key={u.value}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                    textAlign: "left", gap: 4, transition: "all 0.15s",
                    background: active ? u.bg : "#f8fafc",
                    border: `2px solid ${active ? u.color : "#e2e8f0"}`,
                    outline: active ? `3px solid ${u.color}25` : "none",
                    outlineOffset: 1,
                  }}
                  onClick={() => field("urgency", u.value)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: u.color, display: "inline-block", marginBottom: 4 }} />
                  <span style={{ fontWeight: 700, color: u.color, fontSize: 14 }}>{u.label}</span>
                  <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.3 }}>{u.desc}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Divider />

        {/* People count */}
        <Section>
          <label style={s.sectionTitle}>Số lượng người cần cứu *</label>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <button style={s.counterBtn} onClick={() => field("peopleCount", Math.max(1, form.peopleCount - 1))}>−</button>
            <span style={s.counterVal}>{form.peopleCount}</span>
            <button style={s.counterBtn} onClick={() => field("peopleCount", Math.min(99, form.peopleCount + 1))}>+</button>
            <span style={{ color: "#64748b", fontSize: 13, marginLeft: 8 }}>người</span>
          </div>
          {errors.peopleCount && <p style={s.error}>{errors.peopleCount}</p>}
        </Section>

        <Divider />

        {/* Description */}
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

        {/* Image upload */}
        <Section>
          <label style={s.sectionTitle}>
            Ảnh hiện trường <span style={{ color: "#94a3b8", fontWeight: 400 }}>(tối đa 5 ảnh)</span>
          </label>
          <div
            style={{
              border: `2px dashed ${dragOver ? "#2563eb" : "#cbd5e1"}`,
              borderRadius: 14, padding: "28px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              cursor: "pointer", transition: "all 0.2s",
              background: dragOver ? "#eff6ff" : "#f8fafc",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleImageDrop(e.dataTransfer.files); }}
            onClick={() => fileRef.current.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleImageDrop(e.target.files)} />
            <span style={{ fontSize: 32 }}>📷</span>
            <span style={{ color: "#2563eb", fontWeight: 600, fontSize: 14 }}>Nhấn hoặc kéo thả ảnh vào đây</span>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>PNG, JPG, HEIC · Tối đa 10MB mỗi ảnh</span>
          </div>
          {uploadedImages.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {uploadedImages.map((img) => (
                <div key={img.id} style={{ width: 80, height: 80, borderRadius: 10, overflow: "hidden", position: "relative", border: "2px solid #e2e8f0" }}>
                  <img src={img.url} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setUploadedImages((p) => p.filter((i) => i.id !== img.id))}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Divider />

        {/* Submit */}
        <Section>
          <button
            style={{ ...s.btnPrimary, width: "100%", fontSize: 16, padding: "16px", opacity: (submitting || gpsLoading) ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={submitting || gpsLoading}
          >
            {submitting ? <><span style={s.spinnerWhite} /> Đang gửi...</> : "🆘 Gửi yêu cầu cứu hộ"}
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
            Thông tin của bạn được bảo mật và chỉ dùng cho mục đích cứu hộ
          </p>
        </Section>
      </div>
    </Screen>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Screen({ children }) {
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

function Section({ children }) {
  return <div style={{ padding: "20px 24px" }}>{children}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: "#e5e7eb" }} />;
}

function ResultCard({ children }) {
  return (
    <div style={{
      maxWidth: 440, margin: "60px auto", background: "#fff", borderRadius: 20,
      padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center",
      boxShadow: "0 4px 24px rgba(15,23,42,0.10)", border: "1px solid #e5e7eb",
      animation: "fadeIn 0.4s ease both",
    }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value}</span>
    </div>
  );
}

function Badge({ status, children }) {
  const colors = {
    PENDING: { bg: "#dbeafe", color: "#1d4ed8" },
    IN_PROGRESS: { bg: "#fef3c7", color: "#b45309" },
    DONE: { bg: "#dcfce7", color: "#15803d" },
  };
  const c = colors[status] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>
      {children}
    </span>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputSt = (err) => ({
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`,
  fontSize: 14, color: "#1e293b",
  background: err ? "#fff5f5" : "#fff",
  outline: "none", transition: "border 0.2s",
  fontFamily: "'Be Vietnam Pro', sans-serif",
});

const s = {
  header: {
    maxWidth: 680, margin: "0 auto 16px",
    padding: "18px 20px 14px",
    borderRadius: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 12px rgba(15,23,42,0.08)",
    animation: "fadeIn 0.4s ease both",
  },
  headerTop: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: 16, marginBottom: 14,
  },
  alertDot: {
    width: 12, height: 12, borderRadius: "50%",
    background: "#ef4444", flexShrink: 0, marginTop: 6,
    animation: "pulsering 1.4s infinite",
    boxShadow: "0 0 0 0 rgba(239,68,68,0.4)",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 900, color: "#1e293b", lineHeight: 1.2 },
  subtitle: { margin: "4px 0 0", fontSize: 12, color: "#64748b" },
  userBadge: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#f8fafc", borderRadius: 12,
    padding: "8px 12px", border: "1px solid #e2e8f0", flexShrink: 0,
  },
  avatar: {
    width: 34, height: 34, borderRadius: "50%",
    background: "#2563eb", color: "#fff",
    fontWeight: 800, fontSize: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  gpsStrip: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#f8fafc", borderRadius: 10,
    padding: "8px 12px", fontSize: 13,
    border: "1px solid #e2e8f0", color: "#475569", marginBottom: 6,
  },
  card: {
    maxWidth: 680, margin: "0 auto",
    background: "#fff", borderRadius: 20,
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
  toggle: (on) => ({
    width: 48, height: 26, borderRadius: 13,
    background: on ? "#2563eb" : "#cbd5e1",
    border: "none", cursor: "pointer", padding: 3,
    transition: "background 0.25s",
    display: "flex", alignItems: "center", flexShrink: 0,
  }),
  knob: (on) => ({
    width: 20, height: 20, borderRadius: "50%", background: "#fff",
    transition: "transform 0.25s",
    transform: on ? "translateX(22px)" : "translateX(0)",
    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  }),
  onBehalfBox: {
    marginTop: 14, background: "#eff6ff",
    borderRadius: 12, padding: 16, border: "1px solid #bfdbfe",
  },
  counterBtn: {
    width: 40, height: 40, borderRadius: 10,
    border: "1.5px solid #e2e8f0", background: "#f8fafc",
    fontSize: 20, fontWeight: 700, cursor: "pointer",
    color: "#1e3a8a", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s",
  },
  counterVal: { width: 56, textAlign: "center", fontSize: 22, fontWeight: 800, color: "#1e3a8a" },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "12px 24px", borderRadius: 12,
    background: "#2563eb", color: "#fff",
    fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer",
    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
    transition: "all 0.2s", fontFamily: "'Be Vietnam Pro', sans-serif",
  },
  btnSecondary: {
    marginTop: 16, padding: "10px 24px", borderRadius: 10,
    background: "#f1f5f9", color: "#475569", border: "none",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
    fontFamily: "'Be Vietnam Pro', sans-serif",
  },
  spinner: {
    display: "inline-block", width: 12, height: 12,
    border: "2px solid #2563eb", borderTopColor: "transparent",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  spinnerWhite: {
    display: "inline-block", width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  resultTitle: { fontSize: 22, fontWeight: 900, margin: "0 0 6px" },
  resultSub: { color: "#64748b", fontSize: 14, margin: "0 0 20px", textAlign: "center" },
  successRing: {
    position: "absolute", inset: -8, borderRadius: "50%",
    border: "3px solid #22c55e",
    animation: "pulsering 1.5s ease-out infinite",
  },
  successInfo: {
    width: "100%", background: "#f8fafc",
    borderRadius: 12, padding: "12px 16px", border: "1px solid #e2e8f0",
  },
  reqCard: {
    display: "flex", alignItems: "center",
    background: "#fff7ed", borderRadius: 10,
    padding: "10px 16px", border: "1px solid #fed7aa", width: "100%",
  },
  offlineBox: {
    background: "#fffbeb", border: "1px solid #fcd34d",
    borderRadius: 12, padding: "14px 16px", width: "100%",
  },
};