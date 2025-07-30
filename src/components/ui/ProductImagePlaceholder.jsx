import React from 'react';
import { Image } from 'lucide-react';

const ProductImagePlaceholder = ({ 
  productName, 
  size = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    default: 'h-12 w-12',
    large: 'h-24 w-24'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    default: 'h-6 w-6',
    large: 'h-12 w-12'
  };

  // Generate a color based on product name
  const getColorFromName = (name) => {
    if (!name) return 'bg-venezia-100 text-venezia-600';
    
    const colors = [
      'bg-pink-100 text-pink-600',
      'bg-purple-100 text-purple-600',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-red-100 text-red-600',
      'bg-indigo-100 text-indigo-600',
      'bg-orange-100 text-orange-600',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const colorClass = getColorFromName(productName);

  return (
    <div className={`
      ${sizeClasses[size]}
      ${colorClass}
      rounded-lg flex items-center justify-center
      ${className}
    `}>
      <Image className={iconSizes[size]} />
    </div>
  );
};

export default ProductImagePlaceholder;