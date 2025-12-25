const ApiResponse = require("../utils/ApiResponse");
const categoryService = require("../services/categories.service");

async function listCategories(req, res, next) {
  try {
    const result = await categoryService.listCategories(req.query);
    return res.json(new ApiResponse(result.items, null, result.pagination));
  } catch (err) {
    next(err);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return res.json(new ApiResponse(category));
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const created = await categoryService.createCategory(req.body);
    return res.status(201).json(new ApiResponse(created, "Kategori oluşturuldu."));
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const updated = await categoryService.updateCategory(req.params.id, req.body);
    return res.json(new ApiResponse(updated, "Kategori güncellendi."));
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const deleted = await categoryService.softDeleteCategory(req.params.id);
    return res.json(new ApiResponse(deleted, "Kategori silindi."));
  } catch (err) {
    next(err);
  }
}

async function getCategoryBooks(req, res, next) {
  try {
    const result = await categoryService.getCategoryBooks(req.params.id, req.query);
    return res.json(new ApiResponse(result.items, null, result.pagination));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryBooks,
};
