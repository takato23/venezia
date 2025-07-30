import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import clsx from 'clsx';

const OptimizedImage = ({
  src,
  alt,
  className,
  placeholder = '/static/images/placeholder.svg',
  blurDataURL,
  sizes = '100vw',
  quality = 75,
  priority = false,
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}) => {
  const [imageState, setImageState] = useState('loading');
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generate responsive src set based on device pixel ratio
  const generateSrcSet = (baseSrc) => {
    if (!baseSrc || baseSrc === placeholder) return '';
    
    const formats = ['webp', 'avif'];
    const densities = [1, 2];
    const breakpoints = [640, 768, 1024, 1280, 1536];
    
    // For now, return the original src
    // In a real implementation, you'd generate different sizes
    return `${baseSrc} 1x, ${baseSrc} 2x`;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!priority && loading === 'lazy' && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setCurrentSrc(src);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before entering viewport
          threshold: 0.01
        }
      );

      observerRef.current.observe(imgRef.current);
    } else if (priority) {
      // Load immediately for priority images
      setCurrentSrc(src);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority, loading]);

  // Handle image load/error events
  const handleLoad = (event) => {
    setImageState('loaded');
    onLoad?.(event);
  };

  const handleError = (event) => {
    setImageState('error');
    setCurrentSrc(placeholder);
    onError?.(event);
  };

  // Add progressive enhancement with blur-up technique
  const blurStyle = blurDataURL && imageState === 'loading' ? {
    backgroundImage: `url(${blurDataURL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(10px)',
    transform: 'scale(1.1)' // Slight scale to hide blur edges
  } : {};

  return (
    <div className={clsx('relative overflow-hidden', className)} ref={imgRef}>
      {/* Blur placeholder */}
      {blurDataURL && imageState === 'loading' && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={blurStyle}
        />
      )}

      {/* Main image */}
      <motion.img
        src={currentSrc}
        alt={alt}
        srcSet={generateSrcSet(currentSrc)}
        sizes={sizes}
        loading={priority ? 'eager' : loading}
        onLoad={handleLoad}
        onError={handleError}
        className={clsx(
          'transition-opacity duration-300',
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
          imageState === 'error' && 'hidden'
        )}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: imageState === 'loaded' ? 1 : 0,
          scale: imageState === 'loaded' ? 1 : 1.1
        }}
        transition={{ duration: 0.3 }}
        {...props}
      />

      {/* Loading state */}
      {imageState === 'loading' && !blurDataURL && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      )}

      {/* Error state */}
      {imageState === 'error' && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-sm">Error cargando imagen</span>
        </div>
      )}

      {/* Loading indicator overlay */}
      {imageState === 'loading' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}
    </div>
  );
};

// Higher-order component for automatic optimization
export const withImageOptimization = (Component) => {
  return React.forwardRef((props, ref) => {
    const optimizedProps = {
      ...props,
      loading: props.loading || 'lazy',
      quality: props.quality || 75
    };

    return <Component ref={ref} {...optimizedProps} />;
  });
};

// Preload function for critical images
export const preloadImage = (src, priority = false) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    if (priority) {
      // For priority images, we can use higher quality
      img.fetchPriority = 'high';
    }
    
    img.src = src;
  });
};

// Utility to generate blur data URL
export const generateBlurDataURL = (width = 10, height = 10) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  // Create a simple gradient blur placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

export default OptimizedImage;