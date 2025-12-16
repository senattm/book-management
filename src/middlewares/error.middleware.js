const errorMiddleware = (err, req, res, next) => {
const status = err.statusCode || 500;
const message = err.message || "Sunucu tarafında bir hata oluştu.";

console.error(`[HATA]: ${message}`);

res.status(status).json({
    success: false,
    error: message
});
};

module.exports = errorMiddleware;