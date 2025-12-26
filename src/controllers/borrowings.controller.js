const borrowingService = require("../services/borrowings.service");
const ApiResponse = require("../utils/ApiResponse");

const createBorrowing = async (req, res, next) => {
  try {
    const data = await borrowingService.createBorrowing(req.user, req.body);
    return res.status(201).json(new ApiResponse(data, "Ödünç alma kaydı oluşturuldu."));
  } catch (err) {
    next(err);
  }
};

const returnBorrowing = async (req, res, next) => {
  try {
    const data = await borrowingService.returnBorrowing(req.user, req.params.id);
    return res.status(200).json(new ApiResponse(data, "Kitap iade edildi."));
  } catch (err) {
    next(err);
  }
};

const getOverdueBorrowings = async (req, res, next) => {
  try {
    const data = await borrowingService.listOverdueBorrowings(req.user, req.query);
    return res.status(200).json(new ApiResponse(data));
  } catch (err) {
    next(err);
  }
};
const listMyBorrowings = async (req, res, next) => {
  try {
    const result = await borrowingService.listBorrowingsByUser( req.user, req.user.id,  req.query );
    return res.status(200).json(new ApiResponse(result.items, null, result.pagination));
  } catch (err) {
    next(err);
  }
};
module.exports = {
  createBorrowing,
  returnBorrowing,
  getOverdueBorrowings,
  listMyBorrowings
};
