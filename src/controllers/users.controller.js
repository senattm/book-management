const userService = require("../services/users.service");
const ApiResponse = require("../utils/ApiResponse");

const getMe = async (req, res, next) => {
  try {
    const data = await userService.getMe(req.user);
    return res.status(200).json(new ApiResponse(data));
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const data = await userService.listUsers(req.query);
    return res.status(200).json(new ApiResponse(data));
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const data = await userService.getUserById(req.params.id);
    return res.status(200).json(new ApiResponse(data));
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const data = await userService.updateUser(req.user, req.params.id, req.body);
    return res.status(200).json(new ApiResponse(data, "Kullanıcı başarıyla güncellendi."));
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const data = await userService.softDeleteUser(req.params.id);
    return res.status(200).json(new ApiResponse(data, "Kullanıcı başarıyla silindi."));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};
