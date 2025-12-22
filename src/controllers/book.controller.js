const {
  createBook,
  listBooks,
  getBookById,
  updateBook,
  softDeleteBook,
  getBookReviews
} = require("../services/book.service");

const createBookHandler = async (req, res, next) => {
  try {
    const created = await createBook(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

const listBooksHandler = async (req, res, next) => {
  try {
    const result = await listBooks(req.query);
    return res.status(200).json({ success: true, data: result.items, pagination: result.pagination,});
  } catch (err) {
    next(err);
  }
};

const getBookByIdHandler = async (req, res, next) => {
  try {
    const book = await getBookById(req.params.id);
    return res.status(200).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

const updateBookHandler = async (req, res, next) => {
  try {
    const updated = await updateBook(req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteBookHandler = async (req, res, next) => {
  try {
    const deleted = await softDeleteBook(req.params.id);
    return res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    next(err);
  }
};

const getBookReviewsHandler = async (req, res, next) => {
  try {
    const reviews = await getBookReviews(req.params.id);
    return res.status(200).json({  success: true,  data: reviews, });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBookHandler,
  listBooksHandler,
  getBookByIdHandler,
  updateBookHandler,
  deleteBookHandler,
  getBookReviewsHandler,
};
