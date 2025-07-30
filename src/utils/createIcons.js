// Utility to create placeholder icons for PWA
const createPlaceholderIcon = (size, color = '#3b82f6') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = size;
  canvas.height = size;
  
  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Letter V
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.5}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
};

// Generate and save icons (this would normally be done server-side)
export const generateIcons = () => {
  const sizes = [192, 512];
  const icons = {};
  
  sizes.forEach(size => {
    icons[`icon-${size}`] = createPlaceholderIcon(size);
  });
  
  return icons;
};

// Create favicon
export const createFavicon = () => {
  const link = document.querySelector("link[rel~='icon']");
  if (!link) {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    document.head.appendChild(newLink);
  }
  
  const faviconData = createPlaceholderIcon(32);
  const favicon = document.querySelector("link[rel~='icon']");
  if (favicon) {
    favicon.href = faviconData;
  }
};

// Initialize icons
export const initializeIcons = () => {
  // Create favicon
  createFavicon();
  
  // Log that icons are generated (in a real app, these would be actual files)
  console.log('🎨 PWA icons initialized');
};