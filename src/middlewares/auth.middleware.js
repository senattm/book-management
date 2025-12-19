const jwt = require("jsonwebtoken");

const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Yetkilendirme tokeni bulunamadı.");
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    return next(err);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== "access") {
      const err = new Error("Geçersiz token tipi.");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    err.statusCode = 401;
    err.code = "UNAUTHORIZED";
    err.message = "Geçersiz veya süresi dolmuş token";
    next(err);
  }
};

const authorize = (...roles) => {
  return (req, _res, next) => {
   if (!req.user) {
      const err = new Error("Kimlik doğrulaması gereklidir.");
      err.statusCode = 401;
      err.code = "UNAUTHORIZED";
      return next(err);
    }
    if (!roles.includes(req.user.role)) {
      const err = new Error("Bu işlem için yetkiniz bulunmamaktadır.");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      return next(err);
    }
    next();
  };
};

module.exports = { authenticate, authorize };