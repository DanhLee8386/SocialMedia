import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface RegisterFormData {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type PasswordStrength = 'yeu' | 'trungBinh' | 'manh';

interface StrengthInfo {
  level: PasswordStrength;
  label: string;
  percent: number;
  color: string;
  barColor: string;
}

function calcPasswordStrength(password: string): StrengthInfo {
  if (!password) {
    return { level: 'yeu', label: '', percent: 0, color: 'text-gray-400', barColor: 'bg-gray-200' };
  }

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { level: 'yeu', label: 'Yếu', percent: 33, color: 'text-red-500', barColor: 'bg-red-400' };
  }
  if (score <= 3) {
    return { level: 'trungBinh', label: 'Trung bình', percent: 66, color: 'text-yellow-500', barColor: 'bg-yellow-400' };
  }
  return { level: 'manh', label: 'Mạnh', percent: 100, color: 'text-green-600', barColor: 'bg-green-500' };
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      fullName: '',
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');
  const strengthInfo = useMemo(() => calcPasswordStrength(passwordValue), [passwordValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const res = await authService.register({
        fullName: data.fullName,
        userName: data.userName,
        email: data.email,
        password: data.password,
      });
      const body = res.data;
      if (body.success && body.data) {
        auth.login(body.data.token, body.data.user);
        navigate('/feed');
      } else {
        setServerError(body.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
      const errData = axiosErr?.response?.data;
      if (errData?.errors && errData.errors.length > 0) {
        setServerError(errData.errors.join(' '));
      } else {
        setServerError(errData?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{ backgroundColor: '#F0F2F5' }}>
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-sm">
        {/* Tiêu đề */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#1877F2' }}>
            InteractHub
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#606770' }}>
            Tạo tài khoản mới — hoàn toàn miễn phí!
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Họ và tên */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1C1E21' }}
            >
              Họ và tên
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Nhập họ và tên đầy đủ"
              className={`w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
                errors.fullName
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white focus:border-blue-400'
              }`}
              style={{ color: '#1C1E21' }}
              {...register('fullName', {
                required: 'Vui lòng nhập họ và tên.',
                minLength: { value: 2, message: 'Họ và tên phải có ít nhất 2 ký tự.' },
                maxLength: { value: 100, message: 'Họ và tên không được vượt quá 100 ký tự.' },
              })}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          {/* Tên người dùng */}
          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1C1E21' }}
            >
              Tên người dùng
            </label>
            <input
              id="userName"
              type="text"
              autoComplete="username"
              placeholder="Nhập tên người dùng (không dấu)"
              className={`w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
                errors.userName
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white focus:border-blue-400'
              }`}
              style={{ color: '#1C1E21' }}
              {...register('userName', {
                required: 'Vui lòng nhập tên người dùng.',
                minLength: { value: 3, message: 'Tên người dùng phải có ít nhất 3 ký tự.' },
                maxLength: { value: 50, message: 'Tên người dùng không được vượt quá 50 ký tự.' },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới.',
                },
              })}
            />
            {errors.userName && (
              <p className="mt-1 text-xs text-red-500">{errors.userName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1C1E21' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Nhập địa chỉ email"
              className={`w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
                errors.email
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white focus:border-blue-400'
              }`}
              style={{ color: '#1C1E21' }}
              {...register('email', {
                required: 'Vui lòng nhập email.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Địa chỉ email không hợp lệ.',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1C1E21' }}
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Tối thiểu 6 ký tự"
              className={`w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
                errors.password
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white focus:border-blue-400'
              }`}
              style={{ color: '#1C1E21' }}
              {...register('password', {
                required: 'Vui lòng nhập mật khẩu.',
                minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự.' },
                validate: {
                  hasUppercase: (v) =>
                    /[A-Z]/.test(v) || 'Mật khẩu phải chứa ít nhất một chữ hoa.',
                  hasNumber: (v) =>
                    /[0-9]/.test(v) || 'Mật khẩu phải chứa ít nhất một chữ số.',
                  hasSpecial: (v) =>
                    /[^A-Za-z0-9]/.test(v) || 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt.',
                },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}

            {/* Password strength indicator */}
            {passwordValue.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthInfo.barColor}`}
                    style={{ width: `${strengthInfo.percent}%` }}
                  />
                </div>
                <p className={`text-xs font-medium ${strengthInfo.color}`}>
                  Độ mạnh:{' '}
                  <span className="font-semibold">{strengthInfo.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
              style={{ color: '#1C1E21' }}
            >
              Xác nhận mật khẩu
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              className={`w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
                errors.confirmPassword
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white focus:border-blue-400'
              }`}
              style={{ color: '#1C1E21' }}
              {...register('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu.',
                validate: (value) =>
                  value === passwordValue || 'Mật khẩu xác nhận không khớp.',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: '#42B72A' }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    d="M12 3a9 9 0 1 0 9 9"
                  />
                </svg>
                Đang đăng ký...
              </span>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs" style={{ color: '#606770' }}>
            hoặc
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Login link */}
        <p className="text-center text-sm" style={{ color: '#606770' }}>
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-semibold hover:underline"
            style={{ color: '#1877F2' }}
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
