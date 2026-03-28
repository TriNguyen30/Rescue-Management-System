import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function DonationResult() {
  const { search } = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(search), [search]);

  const responseCode = params.get("vnp_ResponseCode");
  const amount = params.get("vnp_Amount");
  const orderInfo = params.get("vnp_OrderInfo");

  // Format tiền (VNPAY trả *100)
  const formattedAmount = useMemo(() => {
    if (!amount) return "";
    const real = Number(amount) / 100;
    return real.toLocaleString("vi-VN") + "₫";
  }, [amount]);

  const isSuccess = responseCode === "00";

  useEffect(() => {
    // 👉 OPTIONAL: gọi backend verify lại
    // axios.get("/donations/vnpay-return" + search)
  }, [search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">

        {/* Icon */}
        <div className="mb-5 flex justify-center">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-9 h-9 text-red-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-gray-900 mb-2">
          {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-6">
          {isSuccess
            ? "Cảm ơn bạn đã đóng góp cho hoạt động cứu trợ."
            : "Giao dịch chưa hoàn tất hoặc đã bị hủy."}
        </p>

        {/* Info */}
        <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 space-y-2 mb-6">
          {formattedAmount && (
            <div className="flex justify-between">
              <span>Số tiền</span>
              <span className="font-bold text-gray-900">{formattedAmount}</span>
            </div>
          )}
          {orderInfo && (
            <div className="flex justify-between">
              <span>Nội dung</span>
              <span className="font-medium text-gray-800">{orderInfo}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Mã phản hồi</span>
            <span className="font-mono">{responseCode}</span>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white
          bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}