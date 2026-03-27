import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Settings,
  BarChart3,
  Shield,
  ArrowRight,
  FileText,
} from "lucide-react";

const cards = [
  {
    title: "Người dùng",
    desc: "Quản lý tài khoản và vai trò",
    to: "/admin/users",
    icon: Users,
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    title: "Báo cáo cứu trợ",
    desc: "Tổng hợp hoạt động cứu hộ & nguồn lực",
    to: "/admin/analytics",
    icon: BarChart3,
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    title: "Cấu hình hệ thống",
    desc: "Danh mục vật tư và tham số vận hành",
    to: "/admin/settings",
    icon: Settings,
    color: "bg-violet-50 text-violet-700 border-violet-100",
  },
];

export default function AdminDashboard() {
  return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bảng điều khiển quản trị</h1>
              <p className="text-sm text-gray-500 mt-1">
                Truy cập nhanh báo cáo, cấu hình và quản lý người dùng
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map(({ title, desc, to, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {title}
                </h2>
                <p className="text-sm text-gray-500 mt-1 flex-1">{desc}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-blue-600">
                  Mở
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-800 font-semibold mb-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Gợi ý
            </div>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>
                Dùng <strong>Báo cáo cứu trợ</strong> để xem tổng hợp yêu cầu theo thời gian, xuất CSV hoặc in.
              </li>
              <li>
                <strong>Cấu hình hệ thống</strong> lưu danh mục và tham số trên trình duyệt; có thể nối API sau.
              </li>
            </ul>
          </div>
        </div>
      </div>
  );
}
