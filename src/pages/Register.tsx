import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, User, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/assets/image/Logo.png";
import { register } from "@/services/auth.service";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "CITIZEN",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.username || !formData.password) {
      alert("Vui lòng nhập đầy đủ họ tên, tên đăng nhập và mật khẩu.");
      return;
    }
    try {
      setIsLoading(true);
      const response = await register({
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        roles: [formData.role],
      });
      if (!response.data.isSuccess) {
        alert(response.data.message || "Đăng ký thất bại.");
        return;
      }
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8 cursor-pointer" 
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={Logo} alt="Logo" className="w-16 h-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">CHUNG TAY VƯỢT LŨ</h1>
          </div>

          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => navigate("/login")}
              className="flex-1 pb-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Đăng nhập
            </button>
            <button className="flex-1 pb-3 text-sm font-semibold text-blue-500 relative">
              Đăng ký
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-500 rounded-full" />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Tạo tài khoản mới</h2>
            <p className="text-sm text-gray-400">Vui lòng điền thông tin bên dưới để đăng ký.</p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Họ và tên", field: "fullName", type: "text", placeholder: "Nguyễn Văn A", icon: <User className="w-4 h-4 text-gray-400" /> },
              { label: "Tên đăng nhập", field: "username", type: "text", placeholder: "Tên đăng nhập", icon: <User className="w-4 h-4 text-gray-400" /> },
              { label: "Email", field: "email", type: "email", placeholder: "Nhập email của bạn", icon: <Mail className="w-4 h-4 text-gray-400" /> },
              { label: "Số điện thoại", field: "phone", type: "tel", placeholder: "Nhập số điện thoại", icon: <Phone className="w-4 h-4 text-gray-400" /> },
            ].map(({ label, field, type, placeholder, icon }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">{icon}</div>
                  <input
                    type={type}
                    value={formData[field as keyof typeof formData]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}