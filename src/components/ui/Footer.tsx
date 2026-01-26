import styles from "@/styles/Footer.module.css";
import "@/styles/Colors.module.css";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <div>
      <footer className={styles.footer}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">Green Space</span>
              </div>
              <p className="text-gray-400 text-sm">
                Kiến tạo không gian sống xanh, thân thiện với thiên nhiên, mỗi
                góc nhỏ trong nhà bạn thành mình
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Khám phá</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Bộ sưu tập Bonsai
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Cây cỏ bàn văn phòng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Dụng cụ chăm sóc
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Phụ kiện trang trí
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Hướng dẫn mua hàng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Chính sách vận chuyển
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Bảo hành & đổi trả
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Câu hỏi thường gặp
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  Thủ Đức, Q9, TP HCM
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-400" />
                  0902345678
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-400" />
                  abc@gmail.com
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 opacity-20 mt-8 pt-8 "></div>
          <p className="text-center text-gray text-sm opacity-50">
            © 2025 Green Space Store. Bảo lưu mọi quyền. Designed for Zen
            living
          </p>
        </div>
      </footer>
    </div>
  );
}
