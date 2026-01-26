import React, { useState } from "react";
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BonSaiImage from "@/assets/image/BonSaiImage.png";
export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    console.log("Login submitted:", { email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Green Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-500 to-green-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative leaf pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
          <img
            src={BonSaiImage}
            alt="BonSai"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col gap-4 text-white">
          {/* Back */}
          <div
            className="flex items-center gap-2 cursor-pointer text-white 
             transition-all duration-200 
             hover:text-green-200 hover:translate-x-[-2px]"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-6 h-6 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="hover:underline underline-offset-4">
              Quay lại trang chủ
            </span>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6" />
            <span className="text-2xl font-bold">Green Space</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Mang thiên nhiên vào
            <br />
            không gian của bạn
          </h1>
          <div className="w-30 h-2 bg-white mb-6 rounded-full" />
          <p className="text-green-50 text-lg max-w-md">
            @ 2025 Cửa hàng cây cảnh BonSai. Bảo lưu mọi quyền
          </p>
        </div>

        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/50 to-green-800/50 mix-blend-multiply pointer-events-none z-0"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Green Space
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 pb-4 text-center font-semibold relative transition-colors
      ${
        activeTab === "login"
          ? "text-green-600"
          : "text-gray-400 hover:text-gray-600"
      }`}
            >
              Đăng nhập
              {activeTab === "login" && (
                <span className="absolute left-0 bottom-0 w-full h-1 bg-green-500 rounded-full" />
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
          ? "text-green-600"
          : "text-gray-400 hover:text-gray-600"
      }`}
            >
              Đăng ký
              {activeTab === "register" && (
                <span className="absolute left-0 bottom-0 w-full h-1 bg-green-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Chào mừng bạn!
            </h2>
            <p className="text-gray-500">
              Vui lòng nhập thông tin để đăng nhập.
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
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

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/30"
            >
              Đăng nhập
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-400">Hoặc tiếp tục với</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Facebook
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
