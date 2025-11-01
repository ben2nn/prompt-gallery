import React, { useState, memo } from 'react';
import Image from 'next/image';

interface CachedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 带缓存的图片组件
 * 依赖浏览器原生缓存机制，简单高效
 * 使用 React.memo 避免不必要的重新渲染
 */
const CachedImageComponent: React.FC<CachedImageProps> = ({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority = false,
  onLoad,
  onError
}) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-slate-700 ${className}`}>
        <svg
          className="w-12 h-12 text-gray-400 dark:text-gray-500 opacity-30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      onLoad={onLoad}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      unoptimized={false}
    />
  );
};

// React.memo 避免父组件重新渲染时图片组件也跟着重新渲染
export const CachedImage = memo(CachedImageComponent, (prevProps, nextProps) => {
  return prevProps.src === nextProps.src;
});
