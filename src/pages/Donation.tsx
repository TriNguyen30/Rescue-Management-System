import React, { useState, useRef, useEffect } from "react";
import {
  Heart, Shield, Users, Zap, ChevronRight, Copy,
  CheckCircle2, Loader2, AlertTriangle, QrCode,
  TrendingUp, Clock, Star, Gift, ArrowRight,
  Banknote, Smartphone, CreditCard, Building2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Method = "bank" | "momo" | "vnpay" | "card";

// ── Animated counter ──────────────────────────────────────────────────────────
function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = React.useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1800;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{count.toLocaleString("vi-VN")}{suffix}</span>;
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max }: { value: number; max: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => setWidth(Math.min((value / max) * 100, 100)), 100);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, max]);
  return (
    <div ref={ref} className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer
                ${copied ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-transparent"}`}>
      {copied ? <><CheckCircle2 className="w-3.5 h-3.5" />Đã sao chép</> : <><Copy className="w-3.5 h-3.5" />Sao chép</>}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

const METHODS: { id: Method; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "bank", label: "Chuyển khoản ngân hàng", icon: <Building2 className="w-4 h-4" />, color: "text-blue-600" },
  { id: "momo", label: "Ví MoMo", icon: <Smartphone className="w-4 h-4" />, color: "text-pink-600" },
  { id: "vnpay", label: "VNPay QR", icon: <QrCode className="w-4 h-4" />, color: "text-red-600" },
  { id: "card", label: "Thẻ tín dụng / Visa", icon: <CreditCard className="w-4 h-4" />, color: "text-purple-600" },
];

const CAMPAIGNS = [
  { id: "general", label: "Quỹ chung Rescue AID", icon: "🏥", color: "border-blue-200 bg-blue-50", active: true },
  { id: "flood", label: "Cứu trợ lũ lụt miền Trung", icon: "🌊", color: "border-cyan-200 bg-cyan-50", active: true },
  { id: "team", label: "Trang bị đội cứu hộ", icon: "🦺", color: "border-orange-200 bg-orange-50", active: false },
];

export default function DonationPage() {
  const [amount, setAmount] = useState<number | "">(200_000);
  const [customAmount, setCustomAmount] = useState("");
  const [method, setMethod] = useState<Method>("bank");
  const [campaign, setCampaign] = useState("general");
  const [donorName, setDonorName] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const finalAmount = customAmount ? parseInt(customAmount.replace(/\D/g, ""), 10) || 0 : (amount as number);

  const formatVND = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} triệu` : n.toLocaleString("vi-VN") + " đ";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!finalAmount || finalAmount < 10_000) e.amount = "Số tiền tối thiểu là 10.000 đ";
    if (finalAmount > 100_000_000) e.amount = "Số tiền tối đa là 100 triệu đ";
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1600));
    setSubmitting(false);
    setStep("success");
  };

  const reset = () => {
    setStep("form");
    setAmount(200_000);
    setCustomAmount("");
    setDonorName("");
    setDonorMessage("");
    setAnonymous(false);
  };

  const selectedCampaign = CAMPAIGNS.find((c) => c.id === campaign)!;
  const selectedMethod = METHODS.find((m) => m.id === method)!;

  return (
    <>
      <style>{`
                .dp { font-family: 'Montserrat', sans-serif; }
                .dp h1, .dp h2, .dp h3 { font-family: 'Montserrat', sans-serif; }
                @keyframes dp-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
                @keyframes dp-in { from{opacity:0} to{opacity:1} }
                @keyframes dp-scale { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
                @keyframes dp-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
                .da1{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .05s both}
                .da2{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .15s both}
                .da3{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .25s both}
                .da4{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .35s both}
                .da5{animation:dp-in .7s ease .1s both}
                .dp-heart{animation:dp-heart 1.8s ease-in-out infinite}
                .amount-btn{transition:all .18s ease}
                .amount-btn:hover{transform:translateY(-1px)}
                .method-btn{transition:all .18s ease}
                .method-btn:hover{transform:translateY(-1px)}
                .dp-success{animation:dp-scale .5s cubic-bezier(.22,1,.36,1) both}
            `}</style>

      <div className="dp bg-white min-h-screen">

        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white pt-14 pb-20 border-b border-gray-100">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)" }} />
            <div className="absolute inset-0"
              style={{ backgroundImage: "linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="da1 inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-1.5 mb-6">
                  <Heart className="w-3.5 h-3.5 text-emerald-600 dp-heart" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Cùng chung tay</span>
                </div>
                <h1 className="da2 text-5xl font-black text-gray-900 leading-[1.05] tracking-tight">
                  Một đồng góp,<br />
                  <span className="text-emerald-600">một sinh mạng</span><br />
                  <span className="text-gray-300 font-semibold">được cứu.</span>
                </h1>
                <p className="da3 mt-5 text-lg text-gray-500 leading-relaxed max-w-md">
                  Mỗi khoản đóng góp của bạn giúp trang bị thêm thiết bị, đào tạo thêm đội cứu hộ và cứu thêm nhiều sinh mạng trong lũ lụt, thiên tai.
                </p>
                <div className="da4 mt-8 flex flex-wrap gap-4 text-sm">
                  {[
                    { icon: <Shield className="w-4 h-4 text-blue-500" />, text: "Minh bạch 100%" },
                    { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Được kiểm toán độc lập" },
                    { icon: <Star className="w-4 h-4 text-amber-400" />, text: "Phi lợi nhuận" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-gray-500 font-medium">
                      {icon}{text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact counter card */}
              <div className="da5 hidden lg:block">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-emerald-100/40 p-7 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng quỹ năm 2024–2025</span>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-gray-900">
                      <CountUp target={4_820_000_000} suffix=" đ" />
                    </div>
                    <div className="text-sm text-gray-400 mt-1">đã quyên góp / mục tiêu 6 tỷ đ</div>
                    <ProgressBar value={4_820_000_000} max={6_000_000_000} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-50">
                    {[
                      { val: 8420, suf: "+", label: "Lượt quyên góp" },
                      { val: 12480, suf: "+", label: "Người được giúp" },
                      { val: 340, suf: "+", label: "Đội cứu hộ" },
                    ].map(({ val, suf, label }) => (
                      <div key={label} className="text-center">
                        <div className="text-xl font-black text-gray-900"><CountUp target={val} suffix={suf} /></div>
                        <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ DONATION FLOW ═════════════════════════════════════════ */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-10">

              {/* ── Left — impact sidebar ── */}
              <div className="lg:col-span-2 space-y-5">

                {/* What your money does */}
                <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-6">
                  <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-500" /> Khoản đóng góp của bạn làm được gì?
                  </h3>
                  <div className="space-y-3">
                    {[
                      { amount: "50.000 đ", impact: "1 bữa ăn nóng cho nạn nhân lũ lụt", icon: "🍲", color: "bg-amber-50 border-amber-100" },
                      { amount: "200.000 đ", impact: "Áo phao cứu sinh cho 1 thành viên đội cứu hộ", icon: "🦺", color: "bg-orange-50 border-orange-100" },
                      { amount: "500.000 đ", impact: "Túi y tế khẩn cấp cho 1 điểm sơ tán", icon: "💊", color: "bg-red-50 border-red-100" },
                      { amount: "1.000.000 đ", impact: "1 ngày hoạt động cho 1 đội cứu hộ 5 người", icon: "🚤", color: "bg-blue-50 border-blue-100" },
                      { amount: "5.000.000 đ", impact: "Trang bị hoàn chỉnh cho 1 đội cứu hộ mới", icon: "🏕️", color: "bg-emerald-50 border-emerald-100" },
                    ].map(({ amount: a, impact, icon, color }) => (
                      <div key={a} className={`flex gap-3 rounded-2xl border p-3 ${color}`}>
                        <span className="text-xl shrink-0">{icon}</span>
                        <div>
                          <div className="text-xs font-black text-gray-800">{a}</div>
                          <div className="text-xs text-gray-500 leading-snug mt-0.5">{impact}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent donors */}
                <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-6">
                  <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Nhà hảo tâm gần đây
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: "Nguyễn Văn T.", amount: "500.000 đ", time: "2 phút trước", msg: "Cầu bình an cho mọi người!" },
                      { name: "Ẩn danh", amount: "1.000.000 đ", time: "15 phút trước", msg: "" },
                      { name: "Trần Thị H.", amount: "200.000 đ", time: "1 giờ trước", msg: "Chúc đội cứu hộ sức khỏe" },
                      { name: "Công ty ABC", amount: "5.000.000 đ", time: "3 giờ trước", msg: "Đồng hành cùng Rescue AID" },
                    ].map(({ name, amount: a, time, msg }, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                          {name === "Ẩn danh" ? "?" : name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-gray-800 truncate">{name}</span>
                            <span className="text-xs font-black text-emerald-600 shrink-0">{a}</span>
                          </div>
                          {msg && <div className="text-[11px] text-gray-400 mt-0.5 truncate">"{msg}"</div>}
                          <div className="text-[11px] text-gray-300 mt-0.5">{time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trust badges */}
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cam kết minh bạch</p>
                  {[
                    { icon: <Shield className="w-4 h-4 text-blue-500" />, text: "100% tiền đến tay người cần" },
                    { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Báo cáo tài chính công khai hàng quý" },
                    { icon: <Star className="w-4 h-4 text-amber-500" />, text: "Được kiểm toán bởi PwC Việt Nam" },
                    { icon: <Users className="w-4 h-4 text-purple-500" />, text: "Ban giám sát độc lập 7 thành viên" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                      <div className="w-7 h-7 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">{icon}</div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right — form ── */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Step indicator */}
                  {step !== "success" && (
                    <div className="flex border-b border-gray-100">
                      {[
                        { s: "form", label: "1. Chọn khoản" },
                        { s: "confirm", label: "2. Xác nhận" },
                      ].map(({ s, label }) => (
                        <div key={s}
                          className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${step === s ? "bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500" : "text-gray-400"}`}>
                          {label}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-7">

                    {/* ── SUCCESS ── */}
                    {step === "success" && (
                      <div className="dp-success flex flex-col items-center text-center py-6 gap-5">
                        <div className="relative w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-3xl bg-emerald-100 animate-ping opacity-30" />
                          <Heart className="w-10 h-10 text-emerald-500 relative dp-heart" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 mb-1">Cảm ơn bạn rất nhiều!</h3>
                          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                            Khoản đóng góp <strong className="text-emerald-600">{finalAmount.toLocaleString("vi-VN")} đ</strong> của bạn đã được ghi nhận và sẽ được sử dụng ngay cho công tác cứu hộ.
                          </p>
                        </div>
                        <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl divide-y divide-gray-100 text-sm overflow-hidden">
                          {[
                            { label: "Mã giao dịch", value: `RES${Date.now().toString().slice(-8)}` },
                            { label: "Chiến dịch", value: selectedCampaign.label },
                            { label: "Phương thức", value: selectedMethod.label },
                            { label: "Số tiền", value: `${finalAmount.toLocaleString("vi-VN")} đ` },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between px-4 py-3">
                              <span className="text-gray-400">{label}</span>
                              <span className="font-bold text-gray-800">{value}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">Biên lai sẽ được gửi qua email nếu bạn đã cung cấp.</p>
                        <button onClick={reset}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                          <Heart className="w-4 h-4" /> Quyên góp thêm
                        </button>
                      </div>
                    )}

                    {/* ── CONFIRM ── */}
                    {step === "confirm" && (
                      <div className="space-y-5">
                        <div>
                          <h2 className="text-xl font-black text-gray-900">Xác nhận đóng góp</h2>
                          <p className="text-sm text-gray-400 mt-1">Kiểm tra thông tin trước khi hoàn tất.</p>
                        </div>

                        {/* Summary */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center space-y-1">
                          <div className="text-3xl font-black text-emerald-700">{finalAmount.toLocaleString("vi-VN")} đ</div>
                          <div className="text-sm text-emerald-600 font-medium">{selectedCampaign.icon} {selectedCampaign.label}</div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100 text-sm overflow-hidden">
                          {[
                            { label: "Phương thức", value: selectedMethod.label },
                            { label: "Người quyên góp", value: anonymous ? "Ẩn danh" : (donorName || "—") },
                            { label: "Lời nhắn", value: donorMessage || "—" },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between px-4 py-3 bg-gray-50/50">
                              <span className="text-gray-400">{label}</span>
                              <span className="font-semibold text-gray-700 text-right max-w-[200px] truncate">{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Bank info if bank transfer */}
                        {method === "bank" && (
                          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
                            <p className="text-xs font-black text-blue-700 uppercase tracking-wider">Thông tin chuyển khoản</p>
                            {[
                              { label: "Ngân hàng", value: "Vietcombank" },
                              { label: "Số tài khoản", value: "1234567890" },
                              { label: "Tên TK", value: "QUY CUU TRO RESCUE AID" },
                              { label: "Nội dung CK", value: `QUYEN GOP ${finalAmount.toLocaleString("vi-VN")}` },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex items-center justify-between gap-3">
                                <span className="text-xs text-blue-600">{label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-blue-800">{value}</span>
                                  <CopyBtn text={value} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* MoMo / VNPay QR placeholder */}
                        {(method === "momo" || method === "vnpay") && (
                          <div className="flex flex-col items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                            <div className="w-32 h-32 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                              <QrCode className="w-16 h-16 text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 text-center">
                              Quét mã QR bằng {method === "momo" ? "ứng dụng MoMo" : "VNPay"} để thanh toán
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button onClick={() => setStep("form")}
                            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                            ← Quay lại
                          </button>
                          <button onClick={handleConfirm} disabled={submitting}
                            className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><CheckCircle2 className="w-4 h-4" /> Xác nhận quyên góp</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── FORM ── */}
                    {step === "form" && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-black text-gray-900">Đóng góp cho Rescue AID</h2>
                          <p className="text-sm text-gray-400 mt-1">Mọi khoản đóng góp đều có ý nghĩa.</p>
                        </div>

                        {/* Campaign select */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chiến dịch</label>
                          <div className="grid grid-cols-1 gap-2">
                            {CAMPAIGNS.map((c) => (
                              <button key={c.id} type="button"
                                onClick={() => setCampaign(c.id)}
                                className={`method-btn flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all
                                                                    ${campaign === c.id ? "border-emerald-400 bg-emerald-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                                <span className="text-xl">{c.icon}</span>
                                <div className="flex-1">
                                  <span className={`text-sm font-bold ${campaign === c.id ? "text-emerald-700" : "text-gray-700"}`}>{c.label}</span>
                                </div>
                                {c.active && (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">Đang quyên</span>
                                )}
                                {campaign === c.id && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Amount presets */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số tiền quyên góp</label>
                          <div className="grid grid-cols-3 gap-2">
                            {PRESET_AMOUNTS.map((a) => (
                              <button key={a} type="button"
                                onClick={() => { setAmount(a); setCustomAmount(""); setErrors({}); }}
                                className={`amount-btn py-2.5 rounded-2xl text-sm font-bold border-2 transition-all
                                                                    ${amount === a && !customAmount
                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                    : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                                  }`}>
                                {formatVND(a)}
                              </button>
                            ))}
                          </div>
                          {/* Custom amount */}
                          <div className="relative">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Hoặc nhập số tiền khác..."
                              value={customAmount}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                setCustomAmount(raw ? parseInt(raw, 10).toLocaleString("vi-VN") : "");
                                setAmount("");
                                setErrors({});
                              }}
                              className={`w-full pl-10 pr-4 py-3 text-sm font-medium text-gray-800 rounded-2xl border transition-colors outline-none
                                                                ${errors.amount ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-emerald-400 focus:bg-white"}`}
                            />
                            {customAmount && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">đ</span>
                            )}
                          </div>
                          {errors.amount && (
                            <p className="flex items-center gap-1 text-xs text-red-500">
                              <AlertTriangle className="w-3.5 h-3.5" />{errors.amount}
                            </p>
                          )}
                          {finalAmount >= 10_000 && (
                            <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                              💚 {finalAmount.toLocaleString("vi-VN")} đ — {finalAmount >= 1_000_000 ? "Trang bị đầy đủ cho 1 đội cứu hộ" : finalAmount >= 500_000 ? "Túi y tế khẩn cấp cho 1 điểm sơ tán" : finalAmount >= 200_000 ? "Áo phao cứu sinh cho 1 thành viên" : "1 bữa ăn nóng cho nạn nhân"}
                            </p>
                          )}
                        </div>

                        {/* Payment method */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phương thức thanh toán</label>
                          <div className="grid grid-cols-2 gap-2">
                            {METHODS.map(({ id, label, icon, color }) => (
                              <button key={id} type="button"
                                onClick={() => setMethod(id)}
                                className={`method-btn flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 text-left transition-all
                                                                    ${method === id ? "border-emerald-400 bg-emerald-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                                <span className={method === id ? "text-emerald-600" : color}>{icon}</span>
                                <span className={`text-xs font-bold ${method === id ? "text-emerald-700" : "text-gray-600"}`}>{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Donor info */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin (tuỳ chọn)</label>
                          <input
                            type="text"
                            placeholder="Họ và tên / Tổ chức"
                            value={donorName}
                            disabled={anonymous}
                            onChange={(e) => setDonorName(e.target.value)}
                            className="w-full px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-300 rounded-2xl border border-gray-200 bg-gray-50 focus:border-emerald-400 focus:bg-white outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                          <textarea
                            rows={2}
                            placeholder="Lời nhắn gửi đến đội cứu hộ..."
                            value={donorMessage}
                            onChange={(e) => setDonorMessage(e.target.value)}
                            style={{ resize: "none" }}
                            className="w-full px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-300 rounded-2xl border border-gray-200 bg-gray-50 focus:border-emerald-400 focus:bg-white outline-none transition-colors"
                          />
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <div
                              onClick={() => setAnonymous((v) => !v)}
                              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shrink-0
                                                                ${anonymous ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                              {anonymous && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-sm text-gray-600 font-medium">Quyên góp ẩn danh</span>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white text-base font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:-translate-y-0.5">
                          <Heart className="w-5 h-5" />
                          Tiếp tục — {finalAmount >= 10_000 ? finalAmount.toLocaleString("vi-VN") + " đ" : "Chọn số tiền"}
                          <ArrowRight className="w-5 h-5" />
                        </button>

                        <p className="text-center text-xs text-gray-400">
                          Thanh toán an toàn · SSL 256-bit · Không lưu thông tin thẻ
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CAMPAIGNS PROGRESS ════════════════════════════════════ */}
        <section className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full mb-3">
                Các chiến dịch đang diễn ra
              </span>
              <h2 className="text-3xl font-black text-gray-900">Chọn nơi bạn muốn đóng góp</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "🏥", title: "Quỹ chung Rescue AID", raised: 4_820_000_000, goal: 6_000_000_000, donors: 8420, desc: "Duy trì hoạt động hệ thống, đào tạo và trang bị cho toàn bộ mạng lưới cứu hộ.", urgent: false },
                { icon: "🌊", title: "Cứu trợ lũ lụt miền Trung", raised: 1_240_000_000, goal: 2_000_000_000, donors: 3150, desc: "Hỗ trợ khẩn cấp cho người dân bị ảnh hưởng bởi đợt lũ lịch sử tháng 10.", urgent: true },
                { icon: "🦺", title: "Trang bị đội cứu hộ mới", raised: 380_000_000, goal: 1_000_000_000, donors: 920, desc: "Mở rộng thêm 20 đội cứu hộ tại các tỉnh miền núi phía Bắc.", urgent: false },
              ].map(({ icon, title, raised, goal, donors, desc, urgent }) => (
                <div key={title} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-2xl">{icon}</span>
                      <h3 className="text-sm font-black text-gray-900 mt-1 leading-snug">{title}</h3>
                    </div>
                    {urgent && (
                      <span className="shrink-0 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-full">
                        🔴 Khẩn cấp
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-black text-emerald-700">{(raised / 1_000_000).toFixed(0)} triệu đ</span>
                      <span className="text-gray-400">/ {(goal / 1_000_000).toFixed(0)} triệu đ</span>
                    </div>
                    <ProgressBar value={raised} max={goal} />
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>{donors.toLocaleString("vi-VN")} lượt quyên góp</span>
                      <span>{Math.round((raised / goal) * 100)}% mục tiêu</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setCampaign(title === "Quỹ chung Rescue AID" ? "general" : title === "Cứu trợ lũ lụt miền Trung" ? "flood" : "team"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors">
                    <Heart className="w-3.5 h-3.5" /> Quyên góp cho chiến dịch này <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}