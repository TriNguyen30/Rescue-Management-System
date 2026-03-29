import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Heart,
  Banknote,
  Filter,
  RefreshCw,
  Receipt,
  MessageSquare,
  Hash,
} from "lucide-react";
import { getMyDonations, DonationItem, DonationStatus } from "@/services/donation.service";

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const statusMeta: Record<DonationStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SUCCESS: {
    label: "Thành công",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  },
  PENDING: {
    label: "Đang chờ",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <Clock className="w-4 h-4 text-amber-500" />,
  },
  FAILED: {
    label: "Thất bại",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: <XCircle className="w-4 h-4 text-red-400" />,
  },
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded-full w-40" />
          <div className="h-3 bg-gray-100 rounded-full w-24" />
        </div>
        <div className="h-6 bg-gray-100 rounded-full w-20" />
      </div>
      <div className="h-8 bg-gray-100 rounded-xl w-32" />
      <div className="h-3 bg-gray-100 rounded-full w-56" />
    </div>
  );
}

// ── Donation card (mobile-first) ───────────────────────────────────────────────
function DonationCard({ item }: { item: DonationItem }) {
  const s = statusMeta[item.status];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Mã đơn</p>
            <p className="text-xs font-mono font-bold text-gray-700 leading-tight">{item.orderId}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${s.bg} ${s.color}`}>
          {s.icon}{s.label}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-0.5">Số tiền</p>
          <p className="text-2xl font-bold text-gray-900">{fmtVND(item.amount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{fmtDate(item.createdAt)}</p>
          <p className="text-xs text-gray-400">{fmtTime(item.createdAt)}</p>
        </div>
      </div>

      {/* Message */}
      {item.message && (
        <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
          <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">{item.message}</p>
        </div>
      )}

      {/* VNPay ref */}
      {item.vnp_TransactionNo && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Hash className="w-3.5 h-3.5 shrink-0" />
          <span>Mã VNPay: <span className="font-mono font-semibold text-gray-600">{item.vnp_TransactionNo}</span></span>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ReceiptHistory() {
  const [items, setItems] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<DonationStatus | "">("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyDonations({
        page,
        limit,
        status: statusFilter || undefined,
      });

      setItems(res?.data ?? []);
      setTotalPages(res?.meta?.totalPages ?? 1);
      setTotal(res?.meta?.total ?? 0);

    } catch (err) {
      console.error("fetchMyDonations error:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, statusFilter]);

  // ── Summary stats from current page ──
  const successItems = items.filter((d) => d.status === "SUCCESS");
  const totalSuccess = successItems.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Lịch sử quyên góp</h1>
              <p className="text-sm text-gray-500 mt-0.5">Các giao dịch bạn đã thực hiện</p>
            </div>
          </div>
          <button
            onClick={() => { setPage(1); fetchData(); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {/* ── Summary banner ── */}
        {!loading && items.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">
                  Tổng đã quyên góp thành công
                </p>
                <p className="text-3xl font-bold tracking-tight">{fmtVND(totalSuccess)}</p>
                <p className="text-emerald-100 text-xs mt-1">{total} giao dịch · trang {page}/{totalPages}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <Banknote className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 font-medium">
            {error}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold bg-white">
            {([["", "Tất cả"], ["SUCCESS", "Thành công"], ["PENDING", "Đang chờ"], ["FAILED", "Thất bại"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setStatusFilter(val as DonationStatus | ""); setPage(1); }}
                className={`px-3 py-1.5 transition-colors border-r last:border-r-0 border-gray-200 ${statusFilter === val ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-600 font-semibold focus:outline-none focus:border-blue-400 ml-auto"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s} / trang</option>
            ))}
          </select>
        </div>

        {/* ── Cards ── */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium text-sm">Chưa có giao dịch nào</p>
              <p className="text-gray-400 text-xs">Các khoản quyên góp của bạn sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            items.map((item) => <DonationCard key={item._id} item={item} />)
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400 font-medium">
              Trang <strong className="text-gray-700">{page}</strong> / {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl border text-xs font-bold transition-colors ${p === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}