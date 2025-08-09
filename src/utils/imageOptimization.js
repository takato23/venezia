// Utilidades para optimización de imágenes

/**
 * Genera URLs de imágenes optimizadas según el tamaño necesario
 * @param {string} originalUrl - URL original de la imagen
 * @param {Object} options - Opciones de optimización
 * @returns {Object} URLs optimizadas para diferentes tamaños
 */
export const getOptimizedImageUrls = (originalUrl, options = {}) => {
  if (!originalUrl) return null;
  
  const {
    widths = [320, 640, 1024, 1920],
    format = 'webp',
    quality = 85
  } = options;
  
  // Si es una URL local, usar la imagen original
  if (originalUrl.startsWith('/') || originalUrl.startsWith('http://localhost')) {
    return {
      src: originalUrl,
      srcSet: originalUrl,
      sizes: '100vw'
    };
  }
  
  // Para URLs externas, generar variantes
  const baseUrl = originalUrl.split('?')[0];
  const extension = baseUrl.split('.').pop();
  
  // Generar srcSet para diferentes anchos
  const srcSet = widths
    .map(width => {
      // Aquí podrías integrar un servicio de optimización como Cloudinary
      // Por ahora, retornamos la URL original
      return `${originalUrl} ${width}w`;
    })
    .join(', ');
  
  return {
    src: originalUrl,
    srcSet,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  };
};

/**
 * Componente de imagen optimizada con lazy loading
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width,
  height,
  loading = 'lazy',
  onError,
  priority = false
}) => {
  const handleError = (e) => {
    e.target.src = '/placeholder-ice-cream.jpg';
    if (onError) onError(e);
  };
  
  const imageProps = getOptimizedImageUrls(src);
  
  return (
    <img
      src={imageProps?.src || '/placeholder-ice-cream.jpg'}
      srcSet={imageProps?.srcSet}
      sizes={imageProps?.sizes}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? 'eager' : loading}
      decoding={priority ? 'sync' : 'async'}
      onError={handleError}
    />
  );
};

/**
 * Precargar imágenes críticas
 */
export const preloadCriticalImages = (imageUrls) => {
  if (typeof window === 'undefined') return;
  
  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Comprimir imagen antes de subir
 */
export const compressImage = async (file, maxWidth = 1200, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular nuevo tamaño manteniendo proporción
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Detectar si el navegador soporta WebP
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 0;
};

/**
 * Lazy load de imágenes con Intersection Observer
 */
export class ImageLazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    };
    
    this.imageObserver = null;
    this.init();
  }
  
  init() {
    if ('IntersectionObserver' in window) {
      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.imageObserver.unobserve(entry.target);
          }
        });
      }, this.options);
    }
  }
  
  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (src) img.src = src;
    if (srcset) img.srcset = srcset;
    
    img.classList.add('loaded');
  }
  
  observe(selector = 'img[data-src]') {
    if (!this.imageObserver) return;
    
    const images = document.querySelectorAll(selector);
    images.forEach(img => this.imageObserver.observe(img));
  }
  
  disconnect() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
  }
}