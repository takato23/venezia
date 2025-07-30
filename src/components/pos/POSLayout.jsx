import React from 'react';
import clsx from 'clsx';

const POSLayout = ({ 
  children, 
  productSection, 
  cartSection,
  isMobile = false,
  cartOpen = false 
}) => {
  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        {/* Products Section - Full screen on mobile */}
        <div className="flex-1 overflow-hidden">
          {productSection}
        </div>
        
        {/* Cart Drawer - Slides up from bottom on mobile */}
        <div className={clsx(
          'fixed inset-x-0 bottom-0 z-50 transition-transform duration-300',
          'bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl',
          cartOpen ? 'translate-y-0' : 'translate-y-full'
        )}>
          <div className="h-[80vh] flex flex-col">
            {cartSection}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-full flex gap-4">
      {/* Products Section - Left side */}
      <div className="flex-1 overflow-hidden">
        {productSection}
      </div>
      
      {/* Cart Section - Right side */}
      <div className="w-96 flex-shrink-0">
        {cartSection}
      </div>
    </div>
  );
};

export default POSLayout;