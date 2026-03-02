import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/assets/image/Logo.png";
import { register } from "@/services/auth.service";

export default function Register() {
  const [activeTab, setActiveTab] = useState("register");
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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      const message =
        error?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Green Background */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative">
        {/* Decorative leaf pattern */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="https://images2.thanhnien.vn/528068263637045248/2024/9/10/afp2024091036fx9yxv2highresnigeriaflood-1725980984689946350501.jpg"
            alt="BonSai"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Logo */}
        <div className="flex items-center text-white relative z-10">
          <div className="flex items-center justify-center"></div>
          <div className="flex items-center">
            <img
              src={Logo}
              alt="Logo"
              className="w-35 h-auto transition-transform hover:scale-110"
            />
            <span className="text-2xl font-bold">CHUNG TAY VƯỢT LŨ</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Cùng nhau
            <br />
            cứu sống những mảnh đời
          </h1>
          <div className="w-30 h-2 bg-white mb-6 rounded-full" />
          <p className="text-green-50 text-lg max-w-md">
            Hãy tham gia cùng chúng tôi trong hành trình cứu trợ và hỗ trợ những
            người bị ảnh hưởng bởi thiên tai lũ lụt.
          </p>
        </div>

        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-0"></div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img
              src={Logo}
              alt="Logo"
              className="w-24 h-auto transition-transform hover:scale-110"
            />
            <span className="text-2xl font-bold text-gray-900">
              CHUNG TAY VƯỢT LŨ
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => {
                setActiveTab("login");
                navigate("/login");
              }}
              className={`flex-1 pb-4 text-center font-semibold relative transition-colors
      ${
        activeTab === "login"
          ? "text-blue-500"
          : "text-gray-400 hover:text-gray-600"
      }`}
            >
              Đăng nhập
              {activeTab === "login" && (
                <span className="absolute left-0 bottom-0 w-full h-1 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("register");
                navigate("/register");
              }}
              className={`flex-1 pb-4 text-center font-semibold relative transition-colors
      ${
        activeTab === "register"
          ? "text-blue-500"
          : "text-gray-400 hover:text-gray-600"
      }`}
            >
              Đăng ký
              {activeTab === "register" && (
                <span className="absolute left-0 bottom-0 w-full h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Tạo tài khoản mới
            </h2>
            <p className="text-gray-500">
              Vui lòng điền thông tin bên dưới để đăng ký tài khoản.
            </p>
          </div>

            {/* Register Form */}
          <div className="space-y-5">
            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Tên đăng nhập"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Nhập số điện thoại của bạn"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Role Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vai trò
              </label>
              <div className="relative">
                <select
                  title="Vai trò"
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="CITIZEN">CITIZEN</option>
                  <option value="RESCUE_TEAM">RESCUE_TEAM</option>
                  <option value="COORDINATOR">COORDINATOR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/30 mt-6"
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
