import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

const sizeMap = {
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-14 h-14 text-base',
  xl:  'w-20 h-20 text-xl',
};

function getInitials(text?: string): string {
  if (!text) return '?';
  const words = text.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({
  src,
  alt = '',
  size = 'md',
  fallback,
  className = '',
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const baseClass = `inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none ${sizeMap[size]} ${className}`;

  if (src && !hasError) {
    return (
      <div className={baseClass}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} bg-[#1877F2] text-white font-semibold`}
      aria-label={alt || fallback || 'Ảnh đại diện'}
    >
      {getInitials(fallback || alt)}
    </div>
  );
}
