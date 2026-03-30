import React, { useState } from "react";
import {
  Phone, Mail, MapPin, Clock, Send, CheckCircle2,
  MessageSquare, AlertTriangle, HeartHandshake,
  ChevronRight, Loader2, Radio,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type FormState = { name: string; phone: string; email: string; subject: string; message: string };
type Errors = Partial<Record<keyof FormState, string>>;

const SUBJECTS = [
  "Báo cáo sự cố khẩn cấp",
  "Đăng ký đội cứu hộ",
  "Hỗ trợ kỹ thuật",
  "Hợp tác & đối tác",
  "Góp ý cải thiện hệ thống",
  "Khác",
];

// ── Input component ───────────────────────────────────────────────────────────
function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertTriangle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-300 rounded-2xl border transition-colors duration-150 outline-none
    ${err ? "border-red-300 bg-red-50 focus:border-red-400" : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white"}`;

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: "", phone: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => { const c = { ...er }; delete c[k]; return c; });
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ và tên";
    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    if (!form.subject) e.subject = "Vui lòng chọn chủ đề";
    if (!form.message.trim()) e.message = "Vui lòng nhập nội dung";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSending(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1400));
    setSending(false);
    setSent(true);
  };

  const reset = () => {
    setForm({ name: "", phone: "", email: "", subject: "", message: "" });
    setErrors({});
    setSent(false);
  };

  return (
    <>
      <style>{`
                .cp { font-family: 'Montserrat', sans-serif; }
                .cp h1, .cp h2, .cp h3 { font-family: 'Montserrat', sans-serif; }
                @keyframes cp-up  { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
                @keyframes cp-in  { from { opacity:0; } to { opacity:1; } }
                .ca1 { animation: cp-up .55s cubic-bezier(.22,1,.36,1) .05s both; }
                .ca2 { animation: cp-up .55s cubic-bezier(.22,1,.36,1) .15s both; }
                .ca3 { animation: cp-up .55s cubic-bezier(.22,1,.36,1) .25s both; }
                .ca4 { animation: cp-up .55s cubic-bezier(.22,1,.36,1) .35s both; }
                .ca5 { animation: cp-in .7s ease .1s both; }
                .info-card { transition: transform .22s ease, box-shadow .22s ease; }
                .info-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.07); }
            `}</style>

      <div className="cp bg-white min-h-screen">

        {/* ── Hero banner ── */}
        <section className="relative overflow-hidden bg-gray-50 pt-14 pb-20 border-b border-gray-100">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)" }} />
            <div className="absolute inset-0"
              style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="ca1 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-6">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Liên hệ với chúng tôi</span>
              </div>
              <h1 className="ca2 text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Chúng tôi luôn<br />
                <span className="text-blue-600">sẵn sàng lắng nghe</span>
              </h1>
              <p className="ca3 mt-5 text-lg text-gray-500 leading-relaxed">
                Dù bạn cần hỗ trợ khẩn cấp, muốn hợp tác hay chỉ đơn giản là có câu hỏi — đội ngũ Rescue AID luôn ở đây.
              </p>

              {/* Quick contact pills */}
              <div className="ca4 mt-8 flex flex-wrap gap-3">
                <a href="tel:0902345678"
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
                  <Phone className="w-4 h-4 text-blue-500" /> 0902 345 678
                </a>
                <a href="mailto:support@rescueaid.vn"
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
                  <Mail className="w-4 h-4 text-blue-500" /> support@rescueaid.vn
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main content ── */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <div className="w-full max-w-2xl space-y-6 ca5">

                {/* ── Left — info cards ── */}
                <div className="flex justify-center px-4">
                  <div className="w-full max-w-3xl space-y-6 ca5">

                    {/* Contact info */}
                    {[
                      {
                        icon: <Phone className="w-5 h-5 text-blue-600" />,
                        bg: "bg-blue-50 border-blue-100",
                        title: "Đường dây nóng",
                        lines: ["0902 345 678", "1800 599 920 (miễn phí)"],
                        sub: "Hỗ trợ 24/7 — không nghỉ lễ",
                      },
                      {
                        icon: <Mail className="w-5 h-5 text-emerald-600" />,
                        bg: "bg-emerald-50 border-emerald-100",
                        title: "Email hỗ trợ",
                        lines: ["support@rescueaid.vn", "rescue@rescueaid.vn"],
                        sub: "Phản hồi trong vòng 2 giờ",
                      },
                      {
                        icon: <MapPin className="w-5 h-5 text-purple-600" />,
                        bg: "bg-purple-50 border-purple-100",
                        title: "Văn phòng",
                        lines: ["Tòa nhà ABC, 123 Lê Lợi", "Quận 1, TP. Hồ Chí Minh"],
                        sub: "Thứ 2 – 6, 8:00 – 17:30",
                      },
                      {
                        icon: <Clock className="w-5 h-5 text-orange-600" />,
                        bg: "bg-orange-50 border-orange-100",
                        title: "Giờ hoạt động",
                        lines: ["Trung tâm điều phối: 24/7"],
                        sub: "Hệ thống tự động: luôn trực tuyến",
                      },
                    ].map(({ icon, bg, title, lines, sub }) => (
                      <div key={title} className={`info-card rounded-3xl border p-5 flex gap-4 ${bg}`}>
                        <div className={`w-10 h-10 rounded-2xl bg-white border flex items-center justify-center shrink-0 shadow-sm ${bg.replace("bg-", "border-")}`}>
                          {icon}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                          {lines.map((l) => (
                            <p key={l} className="text-sm font-bold text-gray-800 leading-snug">{l}</p>
                          ))}
                          <p className="text-xs text-gray-500 mt-1">{sub}</p>
                        </div>
                      </div>
                    ))}

                    {/* Emergency banner */}
                    <div className="rounded-3xl bg-red-600 p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-red-100">Khẩn cấp</span>
                      </div>
                      <p className="text-lg font-black leading-tight mb-1">Cần cứu hộ ngay?</p>
                      <p className="text-sm text-red-100 mb-4">Đừng điền form — hãy gọi ngay đường dây khẩn cấp.</p>
                      <a href="tel:0902345678"
                        className="inline-flex items-center gap-2 bg-white text-red-600 text-sm font-black px-4 py-2.5 rounded-2xl hover:bg-red-50 transition-colors">
                        <Phone className="w-4 h-4" /> Gọi ngay: 0902 345 678
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Channel chips */}
                    <div className="rounded-3xl bg-gray-50 border border-gray-100 p-5 space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kênh hỗ trợ khác</p>
                      {[
                        { icon: <Radio className="w-4 h-4 text-purple-500" />, label: "Zalo OA: Rescue AID", badge: "Nhanh nhất" },
                        { icon: <MessageSquare className="w-4 h-4 text-blue-500" />, label: "Facebook: /rescueaid.vn" },
                        { icon: <HeartHandshake className="w-4 h-4 text-emerald-500" />, label: "Cộng đồng tình nguyện viên" },
                      ].map(({ icon, label, badge }) => (
                        <div key={label} className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm shrink-0">
                            {icon}
                          </div>
                          <span className="font-medium flex-1">{label}</span>
                          {badge && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">{badge}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ strip ── */}
        <section className="bg-gray-50 border-t border-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-3">
                Câu hỏi thường gặp
              </span>
              <h2 className="text-3xl font-black text-gray-900">Có thể bạn đang thắc mắc</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {[
                { q: "Tôi có thể gửi yêu cầu cứu hộ bằng cách nào?", a: "Đăng nhập tài khoản Người dân, chọn 'Gửi yêu cầu cứu hộ', điền mô tả và hệ thống sẽ tự động lấy tọa độ GPS của bạn." },
                { q: "Rescue AID có hoạt động khi mất mạng không?", a: "Có. Hệ thống ghi nhận yêu cầu offline và tự động đồng bộ khi kết nối được khôi phục." },
                { q: "Làm sao để đăng ký đội cứu hộ?", a: "Liên hệ qua email rescue@rescueaid.vn hoặc điền form với chủ đề 'Đăng ký đội cứu hộ'. Chúng tôi sẽ xử lý trong 24 giờ." },
                { q: "Dịch vụ có miễn phí không?", a: "Hoàn toàn miễn phí cho người dân và đội cứu hộ. Rescue AID được tài trợ bởi tổ chức phi lợi nhuận." },
              ].map(({ q, a }) => (
                <div key={q} className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                  <p className="text-sm font-bold text-gray-900 mb-2 leading-snug">{q}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}