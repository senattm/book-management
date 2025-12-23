const rateLimit = require('express-rate-limit');

function rateLimitHandler(code, message) {
  return (req, res) => {
    return res.status(429).json({
      success: false,
      error: {
        code,
        message,
        details: []
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  };
}

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, 
  standardHeaders: true,  
  legacyHeaders: false,   
  handler: rateLimitHandler(
    'RATE_LIMIT_ERROR',
    'Çok fazla istek gönderdiniz. Lütfen daha sonra sonra tekrar deneyiniz.'
  )
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, 
  handler: rateLimitHandler(
    'AUTH_LIMIT_EXCEEDED',
    'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyiniz.'
  )
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'REGISTER_LIMIT_EXCEEDED',
    'Çok fazla kayıt denemesi yaptınız. Lütfen daha sonra tekrar deneyin.'
  )
});

module.exports = { 
  globalLimiter, 
  authLimiter, 
  registerLimiter 
};