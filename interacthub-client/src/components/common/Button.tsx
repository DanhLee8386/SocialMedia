import { ButtonHTMLAttributes, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantMap: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[#1877F2] text-white hover:bg-[#166FE5] active:bg-[#1464D2] disabled:bg-[#1877F2]/50',
  secondary:
    'bg-[#E4E6EB] text-[#1C1E21] hover:bg-[#D8DADF] active:bg-[#CED0D4] disabled:opacity-50',
  danger:
    'bg-[#FA3E3E] text-white hover:bg-[#E03535] active:bg-[#C92E2E] disabled:opacity-50',
  ghost:
    'bg-transparent text-[#1877F2] hover:bg-[#E7F3FF] active:bg-[#D3E8FF] disabled:opacity-50',
};

const sizeMap: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-colors duration-150 cursor-pointer
        disabled:cursor-not-allowed
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${className}
      `}
      {...rest}
    >
      {loading && (
        <LoadingSpinner size="sm" />
      )}
      {children}
    </button>
  );
}
