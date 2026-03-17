import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import {
    Map, Radio, Users, ShieldCheck, AlertTriangle, Clock,
    TrendingUp, HeartHandshake, ChevronRight, Zap, Globe,
    Phone, ArrowRight, CheckCircle2, Activity,
} from "lucide-react";
import Logo from "@/assets/image/LogoV2.png";

// ── Animated counter (triggers on scroll into view) ───────────────────────────
function StatCounter({ value, suffix = "", label, light = false }: {
    value: number; suffix?: string; label: string; light?: boolean;
}) {
    const [count, setCount] = React.useState(0);
    const ref = React.useRef<HTMLDivElement>(null);
    const started = React.useRef(false);

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const duration = 1600;
                const start = performance.now();
                const tick = (now: number) => {
                    const p = Math.min((now - start) / duration, 1);
                    setCount(Math.round((1 - Math.pow(1 - p, 3)) * value));
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.3 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [value]);

    return (
        <div ref={ref} className="text-center">
            <div className={`text-4xl font-black tabular-nums ${light ? "text-white" : "text-gray-900"}`}>
                {count.toLocaleString("vi-VN")}{suffix}
            </div>
            <div className={`text-sm mt-1 font-medium ${light ? "text-blue-100" : "text-gray-500"}`}>{label}</div>
        </div>
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);

    return (
        <>
            <style>{`
                .hp { font-family: 'Montserrat', sans-serif; }
                .hp h1, .hp h2, .hp h3 { font-family: 'Montserrat', sans-serif; }
                @keyframes hp-up    { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
                @keyframes hp-in    { from { opacity:0; } to { opacity:1; } }
                @keyframes hp-float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-10px); } }
                @keyframes hp-ping  { 0%{ transform:scale(1); opacity:.7; } 100%{ transform:scale(1.7); opacity:0; } }
                .a1 { animation: hp-up .6s cubic-bezier(.22,1,.36,1) .05s both; }
                .a2 { animation: hp-up .6s cubic-bezier(.22,1,.36,1) .18s both; }
                .a3 { animation: hp-up .6s cubic-bezier(.22,1,.36,1) .30s both; }
                .a4 { animation: hp-up .6s cubic-bezier(.22,1,.36,1) .42s both; }
                .a5 { animation: hp-in .9s ease .2s both; }
                .hp-float { animation: hp-float 5s ease-in-out infinite; }
                .fcard { transition: transform .25s ease, box-shadow .25s ease; }
                .fcard:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.07); }
                .fcard:hover .ficon { transform: scale(1.12) rotate(-5deg); }
                .ficon { transition: transform .3s cubic-bezier(.34,1.56,.64,1); }
                .hp-btn { transition: transform .2s ease, box-shadow .2s ease; }
                .hp-btn:hover { transform: translateY(-2px); }
            `}</style>

            <div className="hp bg-white">

                {/* ══════════════ HERO ══════════════════════════════════════ */}
                <section className="relative overflow-hidden bg-white pt-14 pb-24">
                    {/* Decorative bg */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)" }} />
                        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 65%)" }} />
                        <div className="absolute inset-0"
                            style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">

                            {/* ── Left ── */}
                            <div>
                                <div className="a1 inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-7">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                    </span>
                                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Hệ thống hoạt động 24/7</span>
                                </div>

                                <h1 className="a2 text-5xl sm:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight">
                                    Cứu Hộ<br />
                                    <span className="text-blue-600">Nhanh Hơn.</span><br />
                                    <span className="text-gray-300 font-semibold">An Toàn Hơn.</span>
                                </h1>

                                <p className="a3 mt-6 text-lg text-gray-500 leading-relaxed max-w-md">
                                    Rescue AID kết nối người dân với đội cứu hộ trong thời gian thực — gửi yêu cầu khẩn cấp, theo dõi bản đồ và nhận hỗ trợ ngay lập tức.
                                </p>

                                <div className="a4 mt-9 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => navigate(user ? "/request" : "/login")}
                                        className="hp-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-200 cursor-pointer"
                                    >
                                        <Zap className="w-4 h-4" />
                                        {user ? "Gửi yêu cầu cứu hộ" : "Bắt đầu ngay"}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => navigate("/map")}
                                        className="hp-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 text-sm font-bold cursor-pointer"
                                    >
                                        <Map className="w-4 h-4 text-blue-500" />
                                        Xem bản đồ
                                    </button>
                                </div>

                                <div className="a4 mt-8 flex flex-wrap gap-5 text-xs text-gray-400 font-medium">
                                    {["Miễn phí hoàn toàn", "Không cần cài đặt", "Phản hồi dưới 15 phút"].map((t) => (
                                        <div key={t} className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{t}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Right — mock card ── */}
                            <div className="a5 hidden lg:flex justify-center">
                                <div className="hp-float relative">
                                    <div className="w-72 bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-blue-100/60 p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <img src={Logo} alt="Logo" className="w-8 h-8 object-contain" />
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Rescue AID</span>
                                            </div>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                <Activity className="w-2.5 h-2.5" /> LIVE
                                            </span>
                                        </div>
                                        {/* Mini map */}
                                        <div className="relative h-36 bg-blue-50 rounded-2xl overflow-hidden border border-blue-100">
                                            <div className="absolute inset-0"
                                                style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
                                            {[
                                                { top: "28%", left: "22%", color: "bg-red-500" },
                                                { top: "54%", left: "58%", color: "bg-blue-500" },
                                                { top: "18%", left: "68%", color: "bg-emerald-500" },
                                            ].map((m, i) => (
                                                <div key={i} className="absolute" style={{ top: m.top, left: m.left }}>
                                                    <div className={`w-3 h-3 rounded-full ${m.color} ring-4 ring-white shadow`} />
                                                    <div className={`absolute inset-0 rounded-full ${m.color} opacity-25`}
                                                        style={{ animation: `hp-ping 2s ease-out ${i * 0.5}s infinite` }} />
                                                </div>
                                            ))}
                                            <div className="absolute bottom-2 right-2 bg-white rounded-lg px-2 py-1 text-[10px] font-bold text-blue-600 border border-blue-100 shadow-sm">
                                                3 vụ đang xử lý
                                            </div>
                                        </div>
                                        {[
                                            { label: "Yêu cầu mới", time: "2 phút trước", dot: "bg-red-500" },
                                            { label: "Đang cứu hộ", time: "8 phút trước", dot: "bg-blue-500" },
                                        ].map(({ label, time, dot }) => (
                                            <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                                                <div className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                                                <span className="text-xs font-semibold text-gray-700 flex-1">{label}</span>
                                                <span className="text-[10px] text-gray-400">{time}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Floating chips */}
                                    <div className="absolute -top-5 -right-10 bg-white rounded-2xl border border-gray-100 shadow-lg px-3 py-2 flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-gray-800">98.7%</div>
                                            <div className="text-[10px] text-gray-400">Tỉ lệ thành công</div>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-5 -left-10 bg-white rounded-2xl border border-gray-100 shadow-lg px-3 py-2 flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-gray-800">&lt; 12 phút</div>
                                            <div className="text-[10px] text-gray-400">Phản hồi trung bình</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════ ANALYTICS STRIP ═══════════════════════════ */}
                <section className="bg-blue-600 py-14">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <StatCounter value={12480} suffix="+" label="Người dân được cứu hộ" light />
                            <StatCounter value={98} suffix="%" label="Tỉ lệ phản hồi thành công" light />
                            <StatCounter value={340} suffix="+" label="Đội cứu hộ tham gia" light />
                            <StatCounter value={63} suffix=" tỉnh" label="Phủ sóng toàn quốc" light />
                        </div>
                    </div>
                </section>

                {/* ══════════════ FEATURES ══════════════════════════════════ */}
                <section className="py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
                                Tính năng nổi bật
                            </span>
                            <h2 className="text-4xl font-black text-gray-900 leading-tight">
                                Mọi công cụ bạn cần<br />
                                <span className="text-blue-600">trong lúc khẩn cấp</span>
                            </h2>
                            <p className="mt-4 text-gray-500 leading-relaxed">
                                Rescue AID trang bị đầy đủ để người dân, đội cứu hộ và điều phối viên phối hợp hiệu quả.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[
                                { icon: <Map className="w-5 h-5" />, color: "bg-blue-50 text-blue-600 border-blue-100", title: "Bản đồ cứu hộ thời gian thực", desc: "Theo dõi vị trí đội cứu hộ, điểm yêu cầu và tình trạng xử lý trực tiếp trên bản đồ GPS.", tag: "GPS · Live" },
                                { icon: <AlertTriangle className="w-5 h-5" />, color: "bg-red-50 text-red-500 border-red-100", title: "Gửi yêu cầu khẩn cấp", desc: "Người dân gửi yêu cầu cứu hộ kèm ảnh và tọa độ GPS tự động — chỉ trong 30 giây.", tag: "Ưu tiên cao" },
                                { icon: <Radio className="w-5 h-5" />, color: "bg-purple-50 text-purple-600 border-purple-100", title: "Phát sóng cảnh báo", desc: "Gửi thông báo khẩn cấp và cảnh báo thiên tai tới toàn bộ người dân trong khu vực.", tag: "Broadcast" },
                                { icon: <Users className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600 border-emerald-100", title: "Quản lý đội cứu hộ", desc: "Điều phối nhân lực, phân công nhiệm vụ và theo dõi trạng thái từng đội theo thời gian thực.", tag: "Quản lý" },
                                { icon: <Globe className="w-5 h-5" />, color: "bg-cyan-50 text-cyan-600 border-cyan-100", title: "Hoạt động offline", desc: "Ghi nhận yêu cầu khi mất mạng, tự động đồng bộ khi kết nối được khôi phục.", tag: "Offline-first" },
                                { icon: <HeartHandshake className="w-5 h-5" />, color: "bg-orange-50 text-orange-600 border-orange-100", title: "Cộng đồng hỗ trợ", desc: "Kết nối người cần giúp đỡ với tình nguyện viên và tổ chức cứu trợ gần nhất.", tag: "Cộng đồng" },
                            ].map(({ icon, color, title, desc, tag }) => (
                                <div key={title} className="fcard bg-white rounded-3xl border border-gray-100 p-6 cursor-default">
                                    <div className={`ficon w-11 h-11 rounded-2xl border flex items-center justify-center mb-4 ${color}`}>
                                        {icon}
                                    </div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="text-sm font-bold text-gray-900 leading-snug">{title}</h3>
                                        <span className="shrink-0 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{tag}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════ HOW IT WORKS ══════════════════════════════ */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full mb-4">
                                Quy trình
                            </span>
                            <h2 className="text-4xl font-black text-gray-900 leading-tight">
                                Hoạt động đơn giản,<br />
                                <span className="text-emerald-600">kết quả tức thì</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-10 relative">
                            <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-100 via-purple-200 to-emerald-100" />
                            {[
                                { step: "01", icon: <Phone className="w-6 h-6 text-blue-600" />, bg: "bg-blue-50 border-blue-200", num: "bg-blue-600", title: "Người dân gửi yêu cầu", desc: "Mô tả tình huống, đính kèm ảnh và vị trí GPS. Chỉ mất 30 giây." },
                                { step: "02", icon: <Activity className="w-6 h-6 text-purple-600" />, bg: "bg-purple-50 border-purple-200", num: "bg-purple-600", title: "Hệ thống điều phối", desc: "Coordinator nhận yêu cầu, đánh giá độ ưu tiên và phân công đội cứu hộ gần nhất." },
                                { step: "03", icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-200", num: "bg-emerald-600", title: "Đội cứu hộ xuất phát", desc: "Đội cứu hộ nhận nhiệm vụ và di chuyển đến hiện trường trong thời gian ngắn nhất." },
                            ].map(({ step, icon, bg, num, title, desc }) => (
                                <div key={step} className="relative flex flex-col items-center text-center px-4">
                                    <div className={`relative w-20 h-20 rounded-3xl border-2 flex items-center justify-center mb-6 ${bg}`}>
                                        {icon}
                                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${num} text-white text-[10px] font-black flex items-center justify-center`}>
                                            {step}
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════ ANALYTICS DETAIL ══════════════════════════ */}
                <section className="py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Stat cards */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50 border-blue-100", value: "12,480+", sub: "Vụ cứu hộ thành công", note: "+18% tháng này" },
                                    { icon: <Clock className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-100", value: "< 12 phút", sub: "Thời gian phản hồi TB", note: "Cải thiện 34%" },
                                    { icon: <Users className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50 border-purple-100", value: "340+", sub: "Đội cứu hộ hoạt động", note: "Toàn quốc" },
                                    { icon: <ShieldCheck className="w-5 h-5 text-orange-600" />, bg: "bg-orange-50 border-orange-100", value: "98.7%", sub: "Tỉ lệ giải quyết thành công", note: "Cao nhất từ trước đến nay" },
                                ].map(({ icon, bg, value, sub, note }) => (
                                    <div key={sub} className={`rounded-3xl border p-5 ${bg}`}>
                                        <div className="mb-3">{icon}</div>
                                        <div className="text-2xl font-black text-gray-900">{value}</div>
                                        <div className="text-xs font-semibold text-gray-600 mt-1 leading-snug">{sub}</div>
                                        <div className="text-[11px] text-gray-400 mt-1">{note}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Text */}
                            <div>
                                <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-6">
                                    Số liệu thực tế
                                </span>
                                <h2 className="text-4xl font-black text-gray-900 leading-tight mb-6">
                                    Mỗi giây đều<br />
                                    <span className="text-blue-600">có ý nghĩa</span>
                                </h2>
                                <p className="text-gray-500 leading-relaxed mb-8">
                                    Rescue AID đã chứng minh hiệu quả qua hàng chục nghìn vụ cứu hộ. Hệ thống liên tục được cải tiến để rút ngắn thời gian phản hồi và nâng cao tỉ lệ thành công.
                                </p>
                                <div className="space-y-3">
                                    {[
                                        "Phủ sóng 63 tỉnh thành trên cả nước",
                                        "Tích hợp với cơ quan phòng chống thiên tai",
                                        "Cập nhật tình trạng theo thời gian thực",
                                        "Hỗ trợ đa ngôn ngữ và người khuyết tật",
                                    ].map((item) => (
                                        <div key={item} className="flex items-center gap-3 text-sm text-gray-600">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════ CALL TO ACTION ════════════════════════════ */}
                <section className="relative py-24 bg-blue-600 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%)" }} />
                        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
                            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)" }} />
                        <div className="absolute inset-0"
                            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "52px 52px" }} />
                    </div>

                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                            </span>
                            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Sẵn sàng hỗ trợ ngay bây giờ</span>
                        </div>

                        <h2 className="text-5xl font-black text-white leading-tight mb-6">
                            Đừng chờ đến khi<br />có chuyện xảy ra
                        </h2>
                        <p className="text-xl text-blue-100 leading-relaxed mb-10 max-w-2xl mx-auto">
                            Đăng ký ngay để kết nối với mạng lưới cứu hộ. Khi thiên tai đến, mỗi giây đều quý giá.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={() => navigate(user ? "/request" : "/login")}
                                className="hp-btn inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-600 text-base font-black shadow-xl"
                            >
                                <Zap className="w-5 h-5" />
                                {user ? "Gửi yêu cầu cứu hộ" : "Đăng ký miễn phí"}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigate("/contact")}
                                className="hp-btn inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/40 text-white text-base font-bold hover:bg-white/10 transition-colors"
                            >
                                <Phone className="w-5 h-5" />
                                Liên hệ hỗ trợ
                            </button>
                        </div>

                        <div className="mt-16 pt-10 border-t border-white/10">
                            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-5">Được tin dùng bởi</p>
                            <div className="flex flex-wrap items-center justify-center gap-8">
                                {["Bộ NN&PTNT", "Ban Chỉ đạo TW PCTT", "Hội Chữ thập đỏ VN", "UBND TP.HCM"].map((p) => (
                                    <span key={p} className="text-sm font-bold text-white/60">{p}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </>
    );
}