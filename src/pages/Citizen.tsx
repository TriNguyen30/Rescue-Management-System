import { useState, useEffect, useRef } from "react";

// ── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CITIZEN = {
  id: "CTZ-001",
  name: "Nguyễn Văn An",
  phone: "0901234567",
  avatar: "NV",
};

const MOCK_EXISTING_REQUEST = null;
// Uncomment below to test "đang có yêu cầu chưa hoàn tất" flow:
// const MOCK_EXISTING_REQUEST = { id: "RQ-0042", status: "IN_PROGRESS", createdAt: "2025-06-01T08:30:00" };

const URGENCY_LEVELS = [
  {
    value: "LOW",
    label: "Nhẹ",
    color: "#22c55e",
    bg: "#dcfce7",
    desc: "Cần hỗ trợ nhưng không nguy hiểm tính mạng",
  },
  {
    value: "MEDIUM",
    label: "Trung bình",
    color: "#f59e0b",
    bg: "#fef3c7",
    desc: "Cần được cứu trong vài giờ tới",
  },
  {
    value: "HIGH",
    label: "Khẩn cấp",
    color: "#ef4444",
    bg: "#fee2e2",
    desc: "Nguy hiểm tính mạng, cần cứu ngay",
  },
  {
    value: "CRITICAL",
    label: "Nguy kịch",
    color: "#7c3aed",
    bg: "#ede9fe",
    desc: "Đe doạ tính mạng trực tiếp, cần heli/thuyền",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function pulse(color) {
  return `0 0 0 0 ${color}40`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RescueRequestPage() {
  const [step, setStep] = useState("form"); // form | success | blocked | offline
  const [onBehalf, setOnBehalf] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
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

  // Simulate GPS fetch
  useEffect(() => {
    const t = setTimeout(() => {
      setForm((f) => ({ ...f, lat: 10.7769, lng: 106.7009 }));
      setGpsLoading(false);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  // Simulate online/offline toggle for demo
  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  const validate = () => {
    const e = {};
    if (!form.urgency) e.urgency = "Vui lòng chọn mức độ khẩn cấp";
    if (form.peopleCount < 1) e.peopleCount = "Số người phải lớn hơn 0";
    if (!form.description.trim()) e.description = "Vui lòng mô tả tình huống";
    if (onBehalf && !form.victimName.trim())
      e.victimName = "Vui lòng nhập tên nạn nhân";
    if (onBehalf && !/^0\d{9}$/.test(form.victimPhone))
      e.victimPhone = "Số điện thoại không hợp lệ";
    return e;
  };

  const handleSubmit = async () => {
    // Check blocked rule
    if (MOCK_EXISTING_REQUEST) {
      setStep("blocked");
      return;
    }

    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));

    if (!isOnline) {
      setStep("offline");
      setSubmitting(false);
      return;
    }

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
    setErrors((e) => {
      const c = { ...e };
      delete c[key];
      return c;
    });
  };

  // ── BLOCKED SCREEN ────────────────────────────────────────────────────────
  if (step === "blocked")
    return (
      <Screen>
        <div style={styles.resultCard}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
          <h2 style={{ ...styles.resultTitle, color: "#dc2626" }}>
            Yêu cầu bị từ chối
          </h2>
          <p style={styles.resultSub}>Bạn đang có yêu cầu chưa hoàn tất</p>
          <div style={styles.reqCard}>
            <span style={styles.badge("IN_PROGRESS")}>Đang xử lý</span>
            <span style={{ color: "#64748b", fontSize: 13, marginLeft: 8 }}>
              #{MOCK_EXISTING_REQUEST?.id}
            </span>
          </div>
          <p
            style={{
              color: "#64748b",
              fontSize: 14,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Vui lòng chờ yêu cầu hiện tại hoàn tất trước khi tạo yêu cầu mới.
          </p>
          <button style={styles.btnSecondary} onClick={() => setStep("form")}>
            ← Quay lại
          </button>
        </div>
      </Screen>
    );

  // ── OFFLINE SCREEN ────────────────────────────────────────────────────────
  if (step === "offline")
    return (
      <Screen>
        <div style={styles.resultCard}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📴</div>
          <h2 style={{ ...styles.resultTitle, color: "#f59e0b" }}>
            Đã lưu ngoại tuyến
          </h2>
          <p style={styles.resultSub}>Không có kết nối mạng</p>
          <div style={styles.offlineBox}>
            <p style={{ margin: 0, fontSize: 14, color: "#92400e" }}>
              ✓ Yêu cầu đã được lưu vào bộ nhớ máy.
              <br />
              Sẽ tự động gửi khi có kết nối mạng.
            </p>
          </div>
          <button style={styles.btnSecondary} onClick={() => setStep("form")}>
            ← Quay lại
          </button>
        </div>
      </Screen>
    );

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (step === "success")
    return (
      <Screen>
        <div style={styles.resultCard}>
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: 16,
            }}
          >
            <div style={styles.successRing} />
            <div style={{ fontSize: 64 }}>✅</div>
          </div>
          <h2 style={{ ...styles.resultTitle, color: "#16a34a" }}>
            Gửi thành công!
          </h2>
          <p style={styles.resultSub}>Vui lòng chờ xác nhận từ đội cứu hộ</p>
          <div style={styles.successInfo}>
            <Row
              label="Mã yêu cầu"
              value={`#RQ-${Math.floor(Math.random() * 9000 + 1000)}`}
            />
            <Row
              label="Trạng thái"
              value={<span style={styles.badge("PENDING")}>Chờ xác nhận</span>}
            />
            <Row
              label="Mức độ"
              value={
                URGENCY_LEVELS.find((u) => u.value === form.urgency)?.label
              }
            />
            <Row label="Số người" value={`${form.peopleCount} người`} />
            <Row
              label="Tọa độ"
              value={`${form.lat?.toFixed(4)}, ${form.lng?.toFixed(4)}`}
            />
          </div>
          <p
            style={{
              color: "#64748b",
              fontSize: 13,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Thông báo đã được gửi tới Rescue Coordinator
          </p>
          <button
            style={styles.btnPrimary}
            onClick={() => {
              setStep("form");
              setForm({
                urgency: "",
                peopleCount: 1,
                description: "",
                victimName: "",
                victimPhone: "",
                lat: 10.7769,
                lng: 106.7009,
              });
              setUploadedImages([]);
              setOnBehalf(false);
            }}
          >
            Tạo yêu cầu mới
          </button>
        </div>
      </Screen>
    );

  // ── MAIN FORM ─────────────────────────────────────────────────────────────
  return (
    <Screen>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.alertPulse} />
          <div>
            <h1 style={styles.title}>🆘 Gửi Yêu Cầu Cứu Hộ</h1>
            <p style={styles.subtitle}>
              Chung Tay Vượt Lũ · Hệ thống cứu hộ khẩn cấp
            </p>
          </div>
          <div style={styles.citizenBadge}>
            <div style={styles.avatar}>{MOCK_CITIZEN.avatar}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e3a8a" }}>
                {MOCK_CITIZEN.name}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {MOCK_CITIZEN.phone}
              </div>
            </div>
          </div>
        </div>

        {/* GPS Strip */}
        <div style={styles.gpsStrip}>
          {gpsLoading ? (
            <>
              <span style={styles.gpsSpinner} />{" "}
              <span style={{ color: "#3b82f6" }}>Đang lấy tọa độ GPS...</span>
            </>
          ) : (
            <>
              <span>📍</span>{" "}
              <span style={{ color: "#16a34a", fontWeight: 600 }}>
                GPS: {form.lat?.toFixed(4)}, {form.lng?.toFixed(4)}
              </span>
              <span
                style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}
              >
                TP. Hồ Chí Minh · Độ chính xác ±5m
              </span>
            </>
          )}
        </div>

        {/* Online indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 0 0",
            fontSize: 12,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isOnline ? "#22c55e" : "#ef4444",
              display: "inline-block",
            }}
          />
          <span style={{ color: isOnline ? "#16a34a" : "#dc2626" }}>
            {isOnline ? "Đang online" : "Offline – sẽ lưu cục bộ"}
          </span>
          {/* Demo toggle */}
          <button
            onClick={() => setIsOnline((v) => !v)}
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: "#94a3b8",
              background: "none",
              border: "1px solid #e2e8f0",
              borderRadius: 4,
              padding: "2px 6px",
              cursor: "pointer",
            }}
          >
            Demo toggle
          </button>
        </div>
      </div>

      <div style={styles.card}>
        {/* ── On Behalf Toggle */}
        <div style={styles.section}>
          <div style={styles.toggleRow}>
            <div>
              <div style={styles.label}>Báo hộ người khác?</div>
              <div style={styles.hint}>
                Chọn nếu bạn đang báo thay cho nạn nhân khác
              </div>
            </div>
            <button
              style={styles.toggle(onBehalf)}
              onClick={() => setOnBehalf((v) => !v)}
            >
              <div style={styles.toggleKnob(onBehalf)} />
            </button>
          </div>

          {onBehalf && (
            <div style={styles.onBehalfBox}>
              <div style={styles.row2}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Tên nạn nhân *</label>
                  <input
                    style={inputStyle(errors.victimName)}
                    placeholder="Nguyễn Văn B"
                    value={form.victimName}
                    onChange={(e) => field("victimName", e.target.value)}
                  />
                  {errors.victimName && (
                    <p style={styles.error}>{errors.victimName}</p>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>SĐT nạn nhân *</label>
                  <input
                    style={inputStyle(errors.victimPhone)}
                    placeholder="0901234567"
                    value={form.victimPhone}
                    onChange={(e) => field("victimPhone", e.target.value)}
                  />
                  {errors.victimPhone && (
                    <p style={styles.error}>{errors.victimPhone}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* ── Urgency Level */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>Mức độ khẩn cấp *</label>
          {errors.urgency && <p style={styles.error}>{errors.urgency}</p>}
          <div style={styles.urgencyGrid}>
            {URGENCY_LEVELS.map((u) => (
              <button
                key={u.value}
                style={{
                  ...styles.urgencyBtn,
                  background: form.urgency === u.value ? u.bg : "#f8fafc",
                  border: `2px solid ${form.urgency === u.value ? u.color : "#e2e8f0"}`,
                  boxShadow:
                    form.urgency === u.value
                      ? `0 0 0 3px ${u.color}30`
                      : "none",
                  transform:
                    form.urgency === u.value ? "scale(1.03)" : "scale(1)",
                }}
                onClick={() => field("urgency", u.value)}
              >
                <span style={{ ...styles.urgencyDot, background: u.color }} />
                <span style={{ fontWeight: 700, color: u.color, fontSize: 14 }}>
                  {u.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    marginTop: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {u.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* ── People Count */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>Số lượng người cần cứu *</label>
          <div style={styles.counterRow}>
            <button
              style={styles.counterBtn}
              onClick={() =>
                field("peopleCount", Math.max(1, form.peopleCount - 1))
              }
            >
              −
            </button>
            <span style={styles.counterVal}>{form.peopleCount}</span>
            <button
              style={styles.counterBtn}
              onClick={() =>
                field("peopleCount", Math.min(99, form.peopleCount + 1))
              }
            >
              +
            </button>
            <span style={{ color: "#64748b", fontSize: 13, marginLeft: 8 }}>
              người
            </span>
          </div>
          {errors.peopleCount && (
            <p style={styles.error}>{errors.peopleCount}</p>
          )}
        </div>

        <Divider />

        {/* ── Description */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>Mô tả tình huống *</label>
          <textarea
            style={{
              ...inputStyle(errors.description),
              minHeight: 100,
              resize: "vertical",
              fontFamily: "inherit",
            }}
            placeholder="Ví dụ: Nhà bị ngập 1.5m, có 3 người già và 2 trẻ em. Không có thuyền, nước đang dâng nhanh..."
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            {errors.description ? (
              <p style={{ ...styles.error, margin: 0 }}>{errors.description}</p>
            ) : (
              <span />
            )}
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {form.description.length}/500
            </span>
          </div>
        </div>

        <Divider />

        {/* ── Image Upload */}
        <div style={styles.section}>
          <label style={styles.sectionTitle}>
            Ảnh hiện trường{" "}
            <span style={{ color: "#94a3b8", fontWeight: 400 }}>
              (tối đa 5 ảnh)
            </span>
          </label>
          <div
            style={{
              ...styles.dropzone,
              borderColor: dragOver ? "#3b82f6" : "#cbd5e1",
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
            onClick={() => fileRef.current.click()}
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
            <span style={{ color: "#3b82f6", fontWeight: 600, fontSize: 14 }}>
              Nhấn hoặc kéo thả ảnh vào đây
            </span>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>
              PNG, JPG, HEIC · Tối đa 10MB mỗi ảnh
            </span>
          </div>
          {uploadedImages.length > 0 && (
            <div style={styles.imageGrid}>
              {uploadedImages.map((img) => (
                <div key={img.id} style={styles.imageThumb}>
                  <img
                    src={img.url}
                    alt={img.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    style={styles.removeImg}
                    onClick={() =>
                      setUploadedImages((p) => p.filter((i) => i.id !== img.id))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* ── Submit */}
        <div style={styles.section}>
          <button
            style={{
              ...styles.btnPrimary,
              width: "100%",
              fontSize: 16,
              padding: "16px",
              opacity: submitting ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={submitting || gpsLoading}
          >
            {submitting ? (
              <>
                <span style={styles.spinner} /> Đang gửi...
              </>
            ) : (
              "🆘 Gửi yêu cầu cứu hộ"
            )}
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#94a3b8",
              marginTop: 10,
            }}
          >
            Thông tin của bạn được bảo mật và chỉ dùng cho mục đích cứu hộ
          </p>
        </div>
      </div>
    </Screen>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Screen({ children }) {
  return (
    <div style={styles.screen}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Be Vietnam Pro', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulsering {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />;
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
        {value}
      </span>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────
const inputStyle = (err) => ({
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

const styles = {
  screen: {
    minHeight: "100vh",
    background: "#ffffff",
    padding: "24px 16px 60px",
    fontFamily: "'Be Vietnam Pro', sans-serif",
  },
  header: {
    maxWidth: 680,
    margin: "0 auto 20px",
    padding: "18px 20px 16px",
    borderRadius: 24,
    background: "#1d4ed8",
    boxShadow: "0 20px 45px rgba(15,23,42,0.45)",
    animation: "fadeInUp 0.5s ease both",
  },
  headerInner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 12,
  },
  alertPulse: {
    position: "relative",
    width: 14,
    height: 14,
    marginTop: 6,
    flexShrink: 0,
    background: "#ef4444",
    borderRadius: "50%",
    boxShadow: "0 0 0 0 rgba(239,68,68,0.4)",
    animation: "pulsering 1.4s infinite",
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#93c5fd",
  },
  citizenBadge: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "8px 12px",
    border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    flexShrink: 0,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
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
    background: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#e2e8f0",
    marginBottom: 6,
  },
  gpsSpinner: {
    display: "inline-block",
    width: 12,
    height: 12,
    border: "2px solid #3b82f6",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  card: {
    maxWidth: 680,
    margin: "-12px auto 0",
    background: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 40px rgba(15,23,42,0.16)",
    animation: "fadeInUp 0.6s ease 0.1s both",
  },
  section: { padding: "20px 24px" },
  sectionTitle: {
    display: "block",
    fontWeight: 700,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 12,
  },
  label: {
    display: "block",
    fontWeight: 600,
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  hint: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  error: { color: "#ef4444", fontSize: 12, margin: "4px 0 0" },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggle: (on) => ({
    width: 48,
    height: 26,
    borderRadius: 13,
    background: on ? "#3b82f6" : "#cbd5e1",
    border: "none",
    cursor: "pointer",
    padding: 3,
    transition: "background 0.25s",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  }),
  toggleKnob: (on) => ({
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
  row2: { display: "flex", gap: 12 },
  urgencyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  urgencyBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
    gap: 4,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginBottom: 4,
    display: "inline-block",
  },
  counterRow: {
    display: "flex",
    alignItems: "center",
    gap: 0,
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
  counterVal: {
    width: 56,
    textAlign: "center",
    fontSize: 22,
    fontWeight: 800,
    color: "#1e3a8a",
  },
  dropzone: {
    border: "2px dashed",
    borderRadius: 14,
    padding: "28px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  imageGrid: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    border: "2px solid #e2e8f0",
  },
  removeImg: {
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
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "12px 24px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(59,130,246,0.4)",
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
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  resultCard: {
    maxWidth: 440,
    margin: "60px auto",
    background: "#fff",
    borderRadius: 24,
    padding: "40px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 22px 45px rgba(15,23,42,0.2)",
    animation: "fadeInUp 0.5s ease both",
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 900,
    margin: "0 0 6px",
  },
  resultSub: {
    color: "#64748b",
    fontSize: 14,
    margin: "0 0 20px",
    textAlign: "center",
  },
  successRing: {
    position: "absolute",
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
  reqCard: {
    display: "flex",
    alignItems: "center",
    background: "#fff7ed",
    borderRadius: 10,
    padding: "10px 16px",
    border: "1px solid #fed7aa",
    width: "100%",
  },
  offlineBox: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: 12,
    padding: "14px 16px",
    width: "100%",
  },
  badge: (status) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background:
      status === "PENDING"
        ? "#dbeafe"
        : status === "IN_PROGRESS"
          ? "#fed7aa"
          : "#f1f5f9",
    color:
      status === "PENDING"
        ? "#1d4ed8"
        : status === "IN_PROGRESS"
          ? "#c2410c"
          : "#64748b",
  }),
};
