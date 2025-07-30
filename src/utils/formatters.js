export const formatCurrency = (amount, currency = 'ARS') => {
  if (amount === null || amount === undefined) return '$0';
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '0';
  
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return new Date(dateString).toLocaleDateString('es-AR', options);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const options = {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  };
  
  return new Date(dateString).toLocaleString('es-AR', options);
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const options = {
    hour: '2-digit', 
    minute: '2-digit'
  };
  
  return new Date(dateString).toLocaleTimeString('es-AR', options);
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  return formatDate(dateString);
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  
  return `${formatNumber(value, decimals)}%`;
};

export const formatUnit = (value, unit) => {
  if (value === null || value === undefined) return `0 ${unit}`;
  
  return `${formatNumber(value)} ${unit}`;
};