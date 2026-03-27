import React, { useState } from "react";
import {
  Heart, Shield, CheckCircle2,
  Star, QrCode, Copy, CreditCard,
  Loader2, AlertTriangle, Zap,
  ArrowRight, Sparkles,
} from "lucide-react";
import QR from "@/assets/image/QR.jpg";
import { createDonation } from "@/services/donation.service";

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
        ${copied
          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
          : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-transparent"}`}>
      {copied
        ? <><CheckCircle2 className="w-3.5 h-3.5" />Đã sao chép</>
        : <><Copy className="w-3.5 h-3.5" />Sao chép</>}
    </button>
  );
}

// ── QR Code Display ───────────────────────────────────────────────────────────
function QRCodeDisplay() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute inset-0 rounded-3xl bg-emerald-400 opacity-10 blur-2xl scale-110 pointer-events-none" />
      <div className="relative bg-white rounded-3xl border-2 border-emerald-100 shadow-2xl shadow-emerald-100/60 p-5 w-64">
        <div className="w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
          <img src={QR} alt="QR" />
        </div>
      </div>
    </div>
  );
}

// ── VNPay Donation Form ───────────────────────────────────────────────────────
const QUICK_AMOUNTS = [
  { label: "10000", value: 10_000 },
  { label: "20000", value: 20_000 },
  { label: "50000", value: 50_000 },
  { label: "100000", value: 100_000 },
  { label: "200000", value: 200_000 },
  { label: "500000", value: 500_000 },
  { label: "1 triệu", value: 1_000_000 },
];

function VNPayForm() {
  const [amount, setAmount] = useState<number | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const finalAmount = Number(amount) || 0;

  const formatVND = (val: number) =>
    val > 0 ? val.toLocaleString("vi-VN") + "₫" : "—";

  const handleSubmit = async () => {
    if (submitting) return;

    setError("");

    if (!finalAmount || isNaN(finalAmount)) {
      setError("Số tiền không hợp lệ.");
      return;
    }

    if (finalAmount < 10_000) {
      setError("Số tiền tối thiểu là 10.000₫.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await createDonation({
        amount: finalAmount,
        message: message.trim(),
      });

      // 🔥 QUAN TRỌNG: redirect ở đây
      window.location.href = res.paymentUrl;

    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        "Không thể tạo yêu cầu thanh toán. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-7 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-black text-white">Thanh toán qua VNPay</h2>
          <p className="text-xs text-blue-100 font-medium">Nhanh chóng · Bảo mật · Tất cả thẻ nội địa & quốc tế</p>
        </div>
      </div>

      <div className="p-7 space-y-6">
        {/* Amount input */}
        <div className="space-y-3">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
            Nhập số tiền quyên góp
          </label>

          {/* Quick-select badges */}
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map(({ label, value }) => {
              const active = amount === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(active ? "" : value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all duration-150 cursor-pointer
                    ${active
                      ? "border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-200"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Manual input */}
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={amount !== "" ? Number(amount).toLocaleString("vi-VN") : ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setAmount(raw ? Number(raw) : "");
              }}
              placeholder="Hoặc nhập số tiền khác..."
              className="w-full pl-4 pr-16 py-3 text-sm font-bold border-2 border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-blue-50/30 transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">VNĐ</span>
          </div>

          {/* Amount preview */}
          {finalAmount >= 10_000 && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Bạn đang quyên góp <span className="font-black ml-1">{formatVND(finalAmount)}</span>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
            Lời nhắn <span className="text-gray-300 font-normal normal-case">(tuỳ chọn)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Gửi lời động viên đến đội cứu hộ..."
            className="w-full px-4 py-3 text-sm border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition resize-none"
          />
          <p className="text-right text-[11px] text-gray-300 font-medium">{message.length}/200</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || finalAmount < 10_000}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black text-white
            bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
            disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed
            shadow-lg shadow-blue-200 hover:shadow-blue-300
            transition-all duration-200 cursor-pointer"
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang chuyển hướng...</>
            : <>Quyên góp ngay qua VNPay <ArrowRight className="w-4 h-4" /></>}
        </button>

        <p className="text-center text-[11px] text-gray-400">
          Được bảo mật bởi VNPay · Mã hóa SSL 256-bit · Hỗ trợ Visa, Mastercard & ATM nội địa
        </p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DonationPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
        .dp { font-family: 'Montserrat', sans-serif; }
        .dp h1, .dp h2, .dp h3 { font-family: 'Montserrat', sans-serif; }
        @keyframes dp-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dp-in { from{opacity:0} to{opacity:1} }
        @keyframes dp-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        .da1{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .05s both}
        .da2{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .15s both}
        .da3{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .25s both}
        .da4{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .35s both}
        .da5{animation:dp-up .55s cubic-bezier(.22,1,.36,1) .45s both}
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
        </section>
        {/* ══ PAYMENT METHODS ═══════════════════════════════════════ */}
        <section className="py-10">
            <div className="flex justify-center flex-wrap">
              {/* ── Left: VNPay form ── */}
            <div className="w-full max-w-2xl">
                <VNPayForm />
              </div>
            </div>
        </section>
      </div>
    </>
  );
}