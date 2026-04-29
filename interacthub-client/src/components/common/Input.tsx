import { InputHTMLAttributes } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  register?: UseFormRegisterReturn;
  helperText?: string;
  required?: boolean;
}

export default function Input({
  label,
  error,
  type = 'text',
  placeholder,
  register,
  helperText,
  required = false,
  className = '',
  id,
  ...rest
}: InputProps) {
  const inputId = id || register?.name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#1C1E21]"
        >
          {label}
          {required && <span className="text-[#FA3E3E] ml-1">*</span>}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`
          w-full px-3 py-2 text-sm text-[#1C1E21]
          bg-[#F0F2F5] rounded-lg border
          placeholder:text-gray-400
          transition-colors duration-150
          outline-none
          ${error
            ? 'border-[#FA3E3E] focus:border-[#FA3E3E] focus:ring-2 focus:ring-[#FA3E3E]/20'
            : 'border-[#CED0D4] focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...register}
        {...rest}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[#FA3E3E] mt-0.5" role="alert">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-gray-500 mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
}
