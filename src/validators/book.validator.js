const { body, validationResult } = require('express-validator');

const createBookValidationRules = [
  body('title').trim().notEmpty().withMessage('Kitap başlığı zorunludur.'),
  body('isbn').trim().notEmpty().withMessage('ISBN alanı zorunludur.'),
  body('authorid').isUUID().withMessage('Geçerli bir yazar ID (UUID) girmelisiniz.'),
  body('categoryid').isUUID().withMessage('Geçerli bir kategori ID (UUID) girmelisiniz.'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stok miktarı negatif olamaz.'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0].msg;
      const err = new Error(firstError);
      err.statusCode = 400;
      return next(err); 
    }
    next(); 
  }
];

module.exports = { createBookValidationRules };