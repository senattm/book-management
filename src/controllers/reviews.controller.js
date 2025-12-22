const reviewService = require("../services/reviews.service");
const ApiResponse = require("../utils/ApiResponse");

const getReviewsByBook = async (req, res, next) => {
  try {
    const data = await reviewService.listReviewsByBook(req.params.id);
    return res.status(200).json(new ApiResponse(data));
  } catch (err) {
    next(err);
  }
};

const createReview = async (req, res, next) => {
  try {
    const data = await reviewService.createReview(req.params.id, req.user, req.body);
    return res.status(201).json(new ApiResponse(data, "Yorum başarıyla oluşturuldu."));
  } catch (err) {
    next(err);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const data = await reviewService.updateReview(req.params.id, req.user, req.body);
    return res.status(200).json(new ApiResponse(data, "Yorum başarıyla güncellendi"));
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await reviewService.softDeleteReview(req.params.id, req.user);
    return res.status(200).json(new ApiResponse(null, "Yorum başarıyla silindi"));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReviewsByBook,
  createReview,
  updateReview,
  deleteReview,
};