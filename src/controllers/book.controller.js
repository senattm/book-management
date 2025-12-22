const bookService = require("../services/book.service");
const ApiResponse = require("../utils/ApiResponse");

const createBook = async (req, res, next) => {
  try {
    const data = await bookService.createBook(req.body);
    return res.status(201).json(new ApiResponse(data, "Kitap başarıyla oluşturuldu"));
  } catch (err) {
    next(err);
  }
};

const getAllBooks = async (req, res, next) => {
  try {
    const result = await bookService.listBooks(req.query);
    return res.status(200).json(new ApiResponse(result.items, null, result.pagination));
  } catch (err) {
    next(err);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const data = await bookService.getBookById(req.params.id);
    return res.status(200).json(new ApiResponse(data));
  } catch (err) {
    next(err);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const data = await bookService.updateBook(req.params.id, req.body);
    return res.status(200).json(new ApiResponse(data, "Kitap başarıyla güncellendi"));
  } catch (err) {
    next(err);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    await bookService.softDeleteBook(req.params.id);
    return res.status(200).json(new ApiResponse(null, "Kitap başarıyla silindi"));
  } catch (err) {
    next(err);
  }
};

const getBookReviews = async (req, res, next) => {
  try {
    const data = await bookService.getBookReviews(req.params.id);
    return res.status(200).json(new ApiResponse(data));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getBookReviews,
};
