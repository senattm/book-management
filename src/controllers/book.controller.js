const { createBook } = require("../services/book.service");

const createBookHandler = async (req, res, next) => {
  try {
    const created = await createBook(req.body); 
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBookHandler };
