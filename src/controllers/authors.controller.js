const authorService = require("../services/authors.service");
const ApiResponse = require("../utils/ApiResponse");

const createAuthor = async (req, res, next) => {
try {
    const data = await authorService.createAuthor(req.body);
     return res.status(201).json(new ApiResponse(data, "Yazar başarıyla oluşturuldu"));
} catch (err) {
    next(err);
}
};

const listAuthors = async (req, res, next) => {
try {
    const result = await authorService.listAuthors(req.query);
    return res.status(200).json(new ApiResponse(result.items, null, result.pagination));
} catch (err) {
    next(err);
}
};

const getAuthorById = async (req, res, next) => {
  try {
    const data = await authorService.getAuthorById(req.params.id);
    return res.status(200).json(new ApiResponse(data));
  } catch (err) {
    next(err);
  }
};

const updateAuthor = async (req, res, next) => {
  try {
    const data = await authorService.updateAuthor(req.params.id, req.body);
    return res.status(200).json(new ApiResponse(data, "Yazar başarıyla güncellendi"));
  } catch (err) {
    next(err);
  }
};

const deleteAuthor = async (req, res, next) => {
  try {
    await authorService.softDeleteAuthor(req.params.id);
    return res.status(200).json(new ApiResponse(null, "Yazar başarıyla silindi"));
  } catch (err) {
    next(err);
  }
};
module.exports = {
createAuthor,
listAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
};