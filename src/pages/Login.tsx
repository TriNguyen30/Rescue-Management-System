import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Phone, Cross } from "lucide-react";
import { PiFirstAidFill } from "react-icons/pi";
import { NavLink, useNavigate } from "react-router-dom";
// import Logo from "@/assets/image/Logo.png";
import Logo from "@/assets/image/LogoV2.png";
import { login } from "@/services/auth.service";
import { useAppDispatch } from "@/store/hooks";
import { setToken, setUser, setRole } from "@/store/slices/authSlice";

const PHONE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 6;

const loginSchema = Yup.object().shape({
  phone: Yup.string()
    .required("Vui lòng nhập số điện thoại.")
    .min(
      PHONE_MIN_LENGTH,
      `Số điện thoại phải có ít nhất ${PHONE_MIN_LENGTH} ký tự.`,
    ),
  password: Yup.string()
    .required("Vui lòng nhập mật khẩu.")
    .min(
      PASSWORD_MIN_LENGTH,
      `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
    ),
});

type LoginValues = {
  phone: string;
  password: string;
};

const initialValues: LoginValues = {
  phone: "",
  password: "",
};

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (values: LoginValues) => {
    setSubmitError(null);
    try {
      setIsLoading(true);
      const response = await login({
        phone: values.phone.trim(),
        password: values.password,
      });
      const apiResponse: any = response.data;
      const isSuccess = apiResponse?.isSuccess ?? apiResponse?.success ?? true;
      if (!isSuccess) {
        setSubmitError(
          apiResponse?.message ||
            "Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại số điện thoại và mật khẩu.",
        );
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
        r === "ADMIN"
          ? "/admin"
          : r === "MANAGER"
            ? "/manager"
            : r === "COORDINATOR"
              ? "/coordinator"
              : r === "RESCUE_TEAM"
                ? "/rescue-team"
                : "/",
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      setSubmitError(
        msg ||
          "Không thể kết nối hoặc thông tin đăng nhập không đúng. Vui lòng kiểm tra số điện thoại, mật khẩu và thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <NavLink
          to="/"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </NavLink>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={Logo} alt="Logo" className="w-16 h-auto mb-3" />

            <h1 className="flex items-center gap-2 text-xl font-bold text-blue-400 tracking-wide">
              <PiFirstAidFill className="text-red-500 w-5 h-5" />
              RESCUE AID
            </h1>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Chào mừng bạn!
            </h2>
            <p className="text-sm text-gray-400">
              Vui lòng nhập thông tin để đăng nhập.
            </p>
          </div>

          {submitError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
            >
              {submitError}
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <Field
                      name="phone"
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.phone && touched.phone
                          ? "border-red-400"
                          : "border-gray-200"
                      }`}
                      aria-describedby={
                        errors.phone && touched.phone
                          ? "phone-error"
                          : undefined
                      }
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p id="phone-error" className="mt-1 text-sm text-red-600">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <Field
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.password && touched.password
                          ? "border-red-400"
                          : "border-gray-200"
                      }`}
                      aria-describedby={
                        errors.password && touched.password
                          ? "password-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p
                      id="password-error"
                      className="mt-1 text-sm text-red-600"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? "Đang xử lý..." : "Đăng nhập"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
