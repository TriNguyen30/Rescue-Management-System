import React, { useState, useRef, useEffect } from "react";
import {
  Heart, Shield, Users, CheckCircle2,
  TrendingUp, Clock, Star, Gift,
  QrCode, Copy, Download,
} from "lucide-react";
import QR from "@/assets/image/QR.jpg";

// ── Animated counter ──────────────────────────────────────────────────────────
function CountUp({ target, suffix = "", prefix = "" }) {
  const [count, setCount] = React.useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1800;
        const t0 = performance.now();
        const tick = (now) => {
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
function ProgressBar({ value, max }) {
  const ref = useRef(null);
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
function CopyBtn({ text }) {
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

// ── QR Placeholder (decorative SVG) ──────────────────────────────────────────
function QRCodeDisplay() {
  return (
    <div className="relative flex flex-col items-center">
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-3xl bg-emerald-400 opacity-10 blur-2xl scale-110 pointer-events-none" />

      <div className="relative bg-white rounded-3xl border-2 border-emerald-100 shadow-2xl shadow-emerald-100/60 p-5 w-64">

        {/* QR grid illustration */}
        <div className="w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
          <img src={QR} alt="QR" />
        </div>

        {/* Bottom label */}
        {/* <div className="mt-3 text-center">
          <p className="text-[10px] text-gray-400 font-medium">Quét bằng <span className="font-bold text-gray-600">ứng dụng ngân hàng</span> bất kỳ</p>
        </div> */}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DonationPage() {
  return (
    <>
      <style>{`
        .dp { font-family: 'Montserrat', sans-serif; }
        .dp h1, .dp h2, .dp h3 { font-family: 'Montserrat', sans-serif; }
        @keyframes dp-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dp-in { from{opacity:0} to{opacity:1} }
        @keyframes dp-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        .da1{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .05s both}
        .da2{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .15s both}
        .da3{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .25s both}
        .da4{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .35s both}
        .da5{animation:dp-in .7s ease .1s both}
        .dp-heart{animation:dp-heart 1.8s ease-in-out infinite}
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
            <div className="grid gap-16 items-center">
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
            </div>
          </div>
        </section>

        {/* ══ QR PAYMENT SECTION ════════════════════════════════════ */}
        <section className="py-16">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl">

              {/* ── Right — QR Payment ── */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Header */}
                  <div className="bg-emerald-50 border-b border-emerald-100 px-7 py-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-gray-900">Quét mã QR để quyên góp</h2>
                      <p className="text-xs text-emerald-600 font-medium">Hỗ trợ tất cả ứng dụng ngân hàng Việt Nam</p>
                    </div>
                  </div>

                  <div className="p-7 space-y-7">

                    {/* QR Code */}
                    <div className="flex justify-center">
                      <QRCodeDisplay />
                    </div>

                    {/* Bank info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
                      <p className="text-xs font-black text-blue-700 uppercase tracking-wider mb-1">Thông tin tài khoản</p>
                      {[
                        { label: "Ngân hàng", value: "TP Bank" },
                        { label: "Số tài khoản", value: "0754 4295 701" },
                        { label: "Tên tài khoản", value: "Nguyễn Công Trí" },
                        { label: "Nội dung chuyển khoản", value: "Nhiều thì 50 triệu, ít thì 10 triệu =))" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <span className="text-xs text-blue-600 shrink-0">{label}</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-black text-blue-800 truncate">{value}</span>
                            <CopyBtn text={value} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Instruction steps */}
                    <div className="space-y-3">
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Hướng dẫn thanh toán</p>
                      {[
                        { step: "1", text: "Mở ứng dụng ngân hàng hoặc ví điện tử của bạn" },
                        { step: "2", text: "Chọn tính năng \"Quét mã QR\"" },
                        { step: "3", text: "Quét mã QR bên trên và nhập số tiền bạn muốn đóng góp" },
                        { step: "4", text: "Xác nhận giao dịch — cảm ơn bạn rất nhiều!" },
                      ].map(({ step, text }) => (
                        <div key={step} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                            {step}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Download QR */}
                    {/* <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors">
                      <Download className="w-4 h-4" />
                      Tải mã QR về máy
                    </button> */}

                    <p className="text-center text-xs text-gray-400">
                      Thanh toán an toàn · Mã hóa SSL 256-bit · Hỗ trợ tất cả ngân hàng Việt Nam
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CAMPAIGNS PROGRESS ════════════════════════════════════ */}
        {/* <section className="py-16 bg-gray-50 border-t border-gray-100">
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
                </div>
              ))}
            </div>
          </div>
        </section> */}
      </div>
    </>
  );
}