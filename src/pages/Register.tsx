import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, User, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/assets/image/LogoV2.png";
import { register } from "@/services/auth.service";

const USERNAME_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 6;
const FULLNAME_MIN_LENGTH = 2;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+()]*$/;

const registerSchema = Yup.object().shape({
  fullName: Yup.string()
    .required("Vui lòng nhập họ và tên.")
    .min(FULLNAME_MIN_LENGTH, `Họ và tên phải có ít nhất ${FULLNAME_MIN_LENGTH} ký tự.`),
  username: Yup.string()
    .required("Vui lòng nhập tên đăng nhập.")
    .min(USERNAME_MIN_LENGTH, `Tên đăng nhập phải có ít nhất ${USERNAME_MIN_LENGTH} ký tự.`),
  email: Yup.string()
    .trim()
    .test("email-format", "Vui lòng nhập đúng định dạng email.", (value) => !value || EMAIL_REGEX.test(value)),
  phone: Yup.string()
    .trim()
    .test("phone-format", "Số điện thoại chỉ được chứa chữ số và ký tự + - ( ).", (value) => !value || PHONE_REGEX.test(value)),
  password: Yup.string()
    .required("Vui lòng nhập mật khẩu.")
    .min(PASSWORD_MIN_LENGTH, `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`),
  role: Yup.string().required(),
});

type RegisterValues = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role: string;
};

const initialValues: RegisterValues = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  role: "CITIZEN",
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: RegisterValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      setIsLoading(true);
      const response = await register({
        username: values.username.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        roles: [values.role],
      });
      const msg: string = response.data.message ?? "";
      const looksLikeSuccess =
        response.data.isSuccess === true ||
        msg.toLowerCase().includes("thành công") ||
        msg.toLowerCase().includes("success");

      if (!looksLikeSuccess) {
        setSubmitError(
          msg || "Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin và thử lại."
        );
        return;
      }
      setSubmitSuccess(
        msg || "Tài khoản đã được tạo thành công. Bạn có thể đăng nhập ngay bây giờ."
      );
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      setSubmitError(
        error?.response?.data?.message ||
        "Không thể đăng ký. Vui lòng kiểm tra kết nối và thông tin rồi thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fields: { label: string; field: keyof RegisterValues; type: string; placeholder: string; icon: React.ReactNode }[] = [
    { label: "Họ và tên", field: "fullName", type: "text", placeholder: "Nguyễn Văn A", icon: <User className="w-4 h-4 text-gray-400" /> },
    { label: "Tên đăng nhập", field: "username", type: "text", placeholder: "Tên đăng nhập", icon: <User className="w-4 h-4 text-gray-400" /> },
    { label: "Email (Tùy chọn)", field: "email", type: "email", placeholder: "Nhập email của bạn", icon: <Mail className="w-4 h-4 text-gray-400" /> },
    { label: "Số điện thoại (Tùy chọn)", field: "phone", type: "tel", placeholder: "Nhập số điện thoại", icon: <Phone className="w-4 h-4 text-gray-400" /> },
  ];

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
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">RESCUE AID</h1>
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

          {/* ── Error alert ── */}
          {submitError && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>{submitError}</span>
            </div>
          )}

          {/* ── Success alert ── */}
          {submitSuccess && (
            <div
              role="status"
              className="mb-4 p-3.5 rounded-xl bg-green-50 border border-green-300 text-sm text-green-800 flex items-start gap-2.5"
            >
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
              <span className="font-medium">{submitSuccess}</span>
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={registerSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-4">
                {fields.map(({ label, field, type, placeholder, icon }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">{icon}</div>
                      <Field
                        name={field}
                        type={type}
                        placeholder={placeholder}
                        className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${errors[field] && touched[field] ? "border-red-400" : "border-gray-200"
                          }`}
                        aria-describedby={errors[field] && touched[field] ? `${field}-error` : undefined}
                      />
                    </div>
                    {errors[field] && touched[field] && (
                      <p id={`${field}-error`} className="mt-1 text-sm text-red-600">
                        {errors[field]}
                      </p>
                    )}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <Field
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${errors.password && touched.password ? "border-red-400" : "border-gray-200"
                        }`}
                      aria-describedby={errors.password && touched.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p id="password-error" className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !!submitSuccess}
                  className="w-full mt-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? "Đang xử lý..." : "Đăng ký"}
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