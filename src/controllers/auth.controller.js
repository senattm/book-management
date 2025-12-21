const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");  

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return res.status(201).json(new ApiResponse(data, "Kayıt başarılı"));
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return res.status(200).json(new ApiResponse(data, "Giriş başarılı"));
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body);
    return res.status(200).json(new ApiResponse(data, "Token yenilendi"));
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const data = await authService.logout({
      refreshToken: req.body.refreshToken,
    });
    return res.status(200).json(new ApiResponse(data, "Çıkış başarılı"));
  } catch (err) {
    next(err);
  }
};


const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body.email);
    return res.status(200).json(
      new ApiResponse(data || null, "Şifre sıfırlama bağlantısı gönderildi")
    );
  } catch (err) {
    next(err);
  }
};


const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return res.status(200).json(
      new ApiResponse(null, "Şifre başarıyla sıfırlandı")
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };