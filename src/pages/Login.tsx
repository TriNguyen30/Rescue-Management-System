import React, { useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/assets/image/Logo.png";
import { login } from "@/services/auth.service";
import { useAppDispatch } from "@/store/hooks";
import { setToken, setUser, setRole } from "@/store/slices/authSlice";

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async () => {
    if (!username || !password) {
      alert("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await login({
        username,
        password,
      });

      const apiResponse: any = response.data;
      const isSuccess =
        apiResponse?.isSuccess ?? apiResponse?.success ?? true;
      if (!isSuccess) {
        alert(apiResponse?.message || "Đăng nhập thất bại.");
        return;
      }

      const payload = apiResponse?.data ?? apiResponse;

      const token = payload.access_token;
      const user = payload.user;
      const role = user?.role;

      dispatch(setToken(token));
      dispatch(setUser(user));
      dispatch(setRole(role));

      const isAdmin = role?.toUpperCase() === "ADMIN";
      const isManager = role?.toUpperCase() === "MANAGER";
      const isCoordinator = role?.toUpperCase() === "COORDINATOR";
      const isRescueTeam = role?.toUpperCase() === "RESCUE_TEAM";
      navigate(isAdmin ? "/admin" : isManager ? "/manager" : isCoordinator ? "/coordinator" : isRescueTeam ? "/rescue-team" : "/");
      
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
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

      {/* Right Panel - Login Form */}
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
              onClick={() => setActiveTab("login")}
              className={`flex-1 pb-4 text-center font-semibold relative transition-colors
      ${activeTab === "login"
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
      ${activeTab === "register"
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập của bạn"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/30"
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
