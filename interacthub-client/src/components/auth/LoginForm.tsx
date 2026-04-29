import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await authService.login(data);
      const body = res.data;
      if (body.success && body.data) {
        auth.login(body.data.token, body.data.user);
        navigate('/feed');
      } else {
        setServerError(body.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosErr?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F2F5' }}>
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-sm">
        {/* Logo / Tiêu đề */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#1877F2' }}>
            InteractHub
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#606770' }}>
            Kết nối với bạn bè và thế giới xung quanh bạn.
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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

          {/* Password */}
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
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              className={`w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
                errors.password
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-white focus:border-blue-400'
              }`}
              style={{ color: '#1C1E21' }}
              {...register('password', {
                required: 'Vui lòng nhập mật khẩu.',
              })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1877F2' }}
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
                Đang đăng nhập...
              </span>
            ) : (
              'Đăng nhập'
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

        {/* Register link */}
        <p className="text-center text-sm" style={{ color: '#606770' }}>
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-semibold hover:underline"
            style={{ color: '#42B72A' }}
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
