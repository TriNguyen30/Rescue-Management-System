import { Mail, MapPin, Phone } from "lucide-react";
import Logo from "@/assets/image/LogoV2.png";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand — identical structure to Navbar logo */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center overflow-hidden">
                <img src={Logo} alt="Rescue AID Logo" className="w-12 h-12 object-contain" />
              </div>
              <div className="leading-none">
                <span className="block text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                  Rescue AID
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Hệ thống cứu hộ khẩn cấp — Chung tay vượt lũ, bảo vệ cộng đồng
              trong mọi tình huống thiên tai.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Khám phá</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                "Bản đồ cứu hộ",
                "Đội cứu hộ",
                "Cảnh báo thiên tai",
                "Phát sóng khẩn cấp",
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                "Hướng dẫn sử dụng",
                "Chính sách bảo mật",
                "Điều khoản dịch vụ",
                "Câu hỏi thường gặp",
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-blue-400 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Liên hệ</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                Thủ Đức, Q9, TP HCM
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                0902 345 678
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                abc@gmail.com
              </li>
            </ul>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-white/10 mt-10 pt-6">
          <p className="text-center text-xs text-gray-500">
            © 2025 Rescue AID. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </footer>
  );
}