import React, { useState, useEffect, useMemo } from "react";
import {
  Heart, Shield, CheckCircle2, Star, Copy, CreditCard,
  Loader2, AlertTriangle, ArrowRight, Trophy, Crown, RefreshCw,
} from "lucide-react";
import { createDonation, getDonations, DonationItem } from "@/services/donation.service";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const shortId = (id: string) =>
  id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

function idToColor(id: any) {
  const realId = typeof id === "string" ? id : id?._id;

  if (!realId) return "bg-gray-100 text-gray-600";

  const colors = [
    "bg-violet-100 text-violet-600",
    "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-rose-100 text-rose-600",
    "bg-cyan-100 text-cyan-600",
    "bg-pink-100 text-pink-600",
    "bg-indigo-100 text-indigo-600",
    "bg-orange-100 text-orange-600",
    "bg-teal-100 text-teal-600",
  ];

  const hash = realId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => { }); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer
        ${copied
          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"}`}>
      {copied ? <><CheckCircle2 className="w-3.5 h-3.5" />Đã sao chép</> : <><Copy className="w-3.5 h-3.5" />Sao chép</>}
    </button>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Donor {
  userId: string;
  name?: string;
  total: number;
  count: number;
  fullName?: string;
}
type Period = "day" | "month" | "total";

// ── Leaderboard ───────────────────────────────────────────────────────────────
function Leaderboard({ items }: { items: DonationItem[] }) {
  const [period, setPeriod] = useState<Period>("total");

  const donors = useMemo(() => {
    const now = new Date();
    const filtered = items.filter((d) => {
      if (d.status !== "SUCCESS") return false;
      const date = new Date(d.createdAt);
      if (period === "day") return date.toDateString() === now.toDateString();
      if (period === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      return true;
    });
    const map: Record<string, Donor> = {};
    filtered.forEach((d) => {
      const uid = typeof d.userId === "string" ? d.userId : d.userId?._id;
      if (!uid) return;

      const name =
        typeof d.userId === "string"
          ? shortId(d.userId) // fallback nếu BE không populate
          : d.userId.fullName || d.userId.username || shortId(uid);

      if (!map[uid]) map[uid] = { userId: uid, name, total: 0, count: 0 };

      map[uid].total += d.amount;
      map[uid].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [items, period]);

  const crownColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  function getInitials(name?: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-black text-gray-800 uppercase tracking-wider">Bảng xếp hạng</span>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-bold">
          {(["day", "month", "total"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 transition-colors ${period === p ? "bg-blue-500 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"}`}>
              {p === "day" ? "Ngày" : p === "month" ? "Tháng" : "Tổng"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 flex-1">
        {donors.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Vui lòng đăng nhập để có thể xem thông tin</div>
        ) : (
          donors.map((d, i) => {
            const uid = d.userId;
            const initials = getInitials(d.name);

            return (
              <div
                key={`${uid}-${i}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Crown */}
                <div className="w-7 flex items-center justify-center shrink-0">
                  {i < 3 ? (
                    <Crown className={`w-5 h-5 ${crownColors[i]}`} />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">
                      #{i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}

                <div
                  className={`w-10 h-10 rounded-full ${idToColor(d.name || uid)} flex items-center justify-center text-sm font-black shrink-0 ring-2 ring-white`}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {d.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {d.count} lần quyên góp
                  </p>
                </div>

                {/* Amount */}
                <p className={`text-sm font-black shrink-0 ${i === 0 ? "text-yellow-600"
                  : i === 1 ? "text-gray-500"
                    : i === 2 ? "text-amber-600"
                      : "text-gray-700"
                  }`}>
                  {fmtVND(d.total)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Recent Messages ───────────────────────────────────────────────────────────
function RecentMessages({ items }: { items: DonationItem[] }) {
  const messages = useMemo(() =>
    [...items]
      .filter((d) => d.status === "SUCCESS" && d.message)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20),
    [items]
  );

  const getInitials = (name?: string) => {
    if (!name) return "?";

    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0]?.toUpperCase();

    return (
      words[0][0] + words[words.length - 1][0]
    ).toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col" style={{ maxHeight: "600px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 shrink-0">
        <RefreshCw className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-black text-gray-800 uppercase tracking-wider">Gần đây</span>
      </div>

      {/* Scrollable feed */}
      <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Vui lòng đăng nhập để có thể xem thông tin</div>
        ) : (
          messages.map((d) => {
            const uid =
              typeof d.userId === "string"
                ? d.userId
                : d.userId?._id || d._id;

            const name =
              typeof d.userId === "string"
                ? shortId(d.userId)
                : d.userId?.fullName || d.userId?.username || shortId(uid);

            const initials = getInitials(name);
            return (
              <div key={d._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full ${idToColor(uid)} flex items-center justify-center text-xs font-black shrink-0 mt-0.5`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + time */}
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-bold text-gray-800 truncate">{name || shortId(uid)}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(d.createdAt)}</span>
                    </div>
                    {/* Amount sub-label */}
                    <p className="text-[11px] text-gray-400 mb-2">
                      Donate <span className="text-amber-600 font-black">{fmtVND(d.amount)}</span> với lời nhắn
                    </p>
                    {/* Message bubble */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-600 leading-relaxed">
                      {d.message}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── VNPay Form ────────────────────────────────────────────────────────────────
const QUICK_AMOUNTS = [
  { label: "10.000", value: 10_000 }, { label: "20.000", value: 20_000 },
  { label: "50.000", value: 50_000 }, { label: "100.000", value: 100_000 },
  { label: "200.000", value: 200_000 }, { label: "500.000", value: 500_000 },
  { label: "1 triệu", value: 1_000_000 },
];

function VNPayForm() {
  const [amount, setAmount] = useState<number | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const finalAmount = Number(amount) || 0;

  const handleSubmit = async () => {
    if (submitting) return;
    setError("");
    if (!finalAmount || isNaN(finalAmount)) { setError("Số tiền không hợp lệ."); return; }
    if (finalAmount < 10_000) { setError("Số tiền tối thiểu là 10.000₫."); return; }
    try {
      setSubmitting(true);
      const res = await createDonation({ amount: finalAmount, message: message.trim() });
      window.location.href = res.paymentUrl;
    } catch (e: any) {
      setError(e?.response?.data?.message || "Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-7 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-black text-white">Chuyển khoản qua VNPay</h2>
          <p className="text-xs text-blue-100 font-medium">Nhanh chóng · Bảo mật · Tất cả thẻ nội địa & quốc tế</p>
        </div>
      </div>

      <div className="p-7 space-y-6">
        <div className="space-y-3">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">Nhập số tiền quyên góp</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map(({ label, value }) => (
              <button key={value} type="button" onClick={() => setAmount(amount === value ? "" : value)}
                className={`px-3 py-1.5 rounded-full text-xs font-black border-2 transition-all cursor-pointer
                  ${amount === value
                    ? "border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-200"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-300 hover:text-blue-600"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input type="text" inputMode="numeric"
              value={amount !== "" ? Number(amount).toLocaleString("vi-VN") : ""}
              onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); setAmount(raw ? Number(raw) : ""); }}
              placeholder="Hoặc nhập số tiền khác..."
              className="w-full pl-4 pr-16 py-3 text-sm font-bold border-2 border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-blue-50/30 transition" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">VNĐ</span>
          </div>
          {finalAmount >= 10_000 && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Bạn đang quyên góp <span className="font-black ml-1">{finalAmount.toLocaleString("vi-VN")}₫</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
            Lời nhắn <span className="text-gray-300 font-normal normal-case">(tuỳ chọn)</span>
          </label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            rows={3} maxLength={200}
            placeholder="Gửi lời động viên đến đội cứu hộ..."
            className="w-full px-4 py-3 text-sm border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition resize-none" />
          <p className="text-right text-[11px] text-gray-400 font-medium">{message.length}/200</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}


        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              window.location.href = "/login"; // route login của bạn
              return;
            }
            handleSubmit();
          }}
          disabled={
            submitting ||
            (isLoggedIn && finalAmount < 10_000)
          }
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black text-white
    bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
    disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed
    shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all cursor-pointer"
        >
          {!isLoggedIn ? (
            <>Đăng nhập để quyên góp <ArrowRight className="w-4 h-4" /></>
          ) : submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Đang chuyển hướng...</>
          ) : (
            <>Quyên góp ngay qua VNPay <ArrowRight className="w-4 h-4" /></>
          )}
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
  const [allItems, setAllItems] = useState<DonationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const collected: DonationItem[] = [];
        let currentPage = 1;
        let pages = 1;
        do {
          const res = await getDonations({ page: currentPage, limit: 100 });
          collected.push(...(res?.data?.data ?? res?.data ?? []));
          pages = res?.data?.meta?.totalPages ?? res?.meta?.totalPages ?? 1;
          currentPage++;
        } while (currentPage <= pages);
        setAllItems(collected);
      } catch (e) {
        console.error("fetchAll error:", e);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchAll();
  }, []);

  const skeletonRows = (n: number) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-7 h-5 bg-gray-100 rounded" />
          <div className="w-10 h-10 bg-gray-100 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded w-28" />
            <div className="h-2.5 bg-gray-50 rounded w-16" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');
        .dp { font-family: 'Montserrat', sans-serif; }
        @keyframes dp-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dp-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        .da1{animation:dp-up .5s cubic-bezier(.22,1,.36,1) .05s both}
        .da2{animation:dp-up .5s cubic-bezier(.22,1,.36,1) .15s both}
        .da3{animation:dp-up .5s cubic-bezier(.22,1,.36,1) .25s both}
        .da4{animation:dp-up .5s cubic-bezier(.22,1,.36,1) .35s both}
        .dp-heart{animation:dp-heart 1.8s ease-in-out infinite}
      `}</style>

      <div className="dp bg-gray-50 min-h-screen">

        {/* ══ HERO ══ */}
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
                <div key={text} className="flex items-center gap-2 text-gray-500 font-medium">{icon}{text}</div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PAYMENT FORM ══ */}
        {/* <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="w-full max-w-md sm:max-w-xl lg:max-w-2xl">
              <VNPayForm />
            </div>
          </div>
        </section> */}

        {/* ══ LEADERBOARD + MESSAGES ══ */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6 items-start">

              {/* LEFT COLUMN */}
              <div className="space-y-6">
                <VNPayForm />
                {loadingItems ? skeletonRows(7) : <Leaderboard items={allItems} />}
              </div>

              {/* RIGHT COLUMN */}
              <div>
                {loadingItems ? skeletonRows(4) : <RecentMessages items={allItems} />}
              </div>

            </div>
          </div>
        </section>

      </div>
    </>
  );
}