import React, { useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/assets/image/Logo.png";
import { login } from "@/services/auth.service";
import { useAppDispatch } from "@/store/hooks";
import { setToken, setUser, setRole } from "@/store/slices/authSlice";

export default function Login() {
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
      const response = await login({ username, password });
      const apiResponse: any = response.data;
      const isSuccess = apiResponse?.isSuccess ?? apiResponse?.success ?? true;
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
      const r = role?.toUpperCase();
      navigate(
        r === "ADMIN" ? "/admin" :
          r === "MANAGER" ? "/manager" :
            r === "COORDINATOR" ? "/coordinator" :
              r === "RESCUE_TEAM" ? "/rescue-team" : "/"
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
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
            <button className="flex-1 pb-3 text-sm font-semibold text-blue-500 relative">
              Đăng nhập
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-500 rounded-full" />
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex-1 pb-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Đăng ký
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Chào mừng bạn!</h2>
            <p className="text-sm text-gray-400">Vui lòng nhập thông tin để đăng nhập.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}