// Performance monitoring and optimization middleware
const compression = require('compression');

// Request timing middleware
const requestTiming = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Store original end function
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Add timing header
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }
    
    // Call original end
    originalEnd.apply(res, args);
  };
  
  next();
};

// Cache control middleware
const cacheControl = (options = {}) => {
  const defaults = {
    public: {
      maxAge: 86400, // 1 day
      paths: ['/images', '/fonts', '/static']
    },
    private: {
      maxAge: 0,
      paths: ['/api/user', '/api/auth']
    },
    api: {
      maxAge: 300, // 5 minutes
      paths: ['/api/products', '/api/providers']
    }
  };
  
  const config = { ...defaults, ...options };
  
  return (req, res, next) => {
    // Skip non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Determine cache policy
    let cachePolicy = null;
    
    for (const [type, settings] of Object.entries(config)) {
      if (settings.paths.some(path => req.path.startsWith(path))) {
        cachePolicy = { type, ...settings };
        break;
      }
    }
    
    if (cachePolicy) {
      if (cachePolicy.type === 'public') {
        res.setHeader('Cache-Control', `public, max-age=${cachePolicy.maxAge}`);
      } else if (cachePolicy.type === 'private') {
        res.setHeader('Cache-Control', `private, no-cache, no-store, must-revalidate`);
      } else {
        res.setHeader('Cache-Control', `private, max-age=${cachePolicy.maxAge}`);
      }
    }
    
    next();
  };
};

// Response compression
const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Fallback to standard filter function
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024 // Only compress responses larger than 1KB
});

// Database query optimization hints
const queryOptimizer = {
  // Add indexes hint
  addIndexHint: (query, index) => {
    // This would be database-specific
    return query;
  },
  
  // Add query timeout
  withTimeout: (query, timeout = 5000) => {
    return Promise.race([
      query,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ]);
  },
  
  // Cache frequent queries
  cache: new Map(),
  
  withCache: async (key, queryFn, ttl = 300000) => { // 5 minutes default
    const cached = queryOptimizer.cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const data = await queryFn();
    queryOptimizer.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
    
    return data;
  },
  
  // Clear expired cache entries
  clearExpired: () => {
    const now = Date.now();
    for (const [key, value] of queryOptimizer.cache.entries()) {
      if (value.expires <= now) {
        queryOptimizer.cache.delete(key);
      }
    }
  }
};

// Clear cache periodically
setInterval(() => {
  queryOptimizer.clearExpired();
}, 60000); // Every minute

// Rate limiting per endpoint
const endpointRateLimit = (limits = {}) => {
  const requests = new Map();
  
  // Default limits
  const defaultLimits = {
    '/api/auth/login': { requests: 5, window: 300000 }, // 5 requests per 5 minutes
    '/api/ai': { requests: 10, window: 60000 }, // 10 requests per minute
    'default': { requests: 100, window: 60000 } // 100 requests per minute
  };
  
  const allLimits = { ...defaultLimits, ...limits };
  
  return (req, res, next) => {
    const path = req.path;
    const ip = req.ip;
    const key = `${ip}:${path}`;
    
    // Find applicable limit
    let limit = allLimits[path] || allLimits.default;
    
    // Get current request count
    const now = Date.now();
    const userRequests = requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(
      time => now - time < limit.window
    );
    
    if (recentRequests.length >= limit.requests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(limit.window / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    // Clean up old entries periodically
    if (requests.size > 10000) {
      for (const [k, v] of requests.entries()) {
        if (v.length === 0 || now - v[v.length - 1] > 3600000) {
          requests.delete(k);
        }
      }
    }
    
    next();
  };
};

module.exports = {
  requestTiming,
  cacheControl,
  compressionMiddleware,
  queryOptimizer,
  endpointRateLimit
};