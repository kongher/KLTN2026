const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const authService = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  return success(res, "Verification code sent", data);
});

const verifyEmailOtp = asyncHandler(async (req, res) => {
  const data = await authService.verifyEmailOtp(req.body);
  return success(res, "Register successful", data, 201);
});

const resendEmailOtp = asyncHandler(async (req, res) => {
  const data = await authService.resendEmailOtp(req.body);
  return success(res, "Verification code sent", data);
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  return success(res, "Login successful", data);
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.getMe(req.user.userId);
  return success(res, "Current user", data);
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(
    req.user.userId,
    req.body.currentPassword,
    req.body.newPassword
  );
  return success(res, "Password changed successfully");
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body.email);
  return success(
    res,
    "Reset token generated. In production this would be sent by email.",
    data
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  return success(res, "Password reset successfully");
});

const logout = asyncHandler(async (req, res) => {
  return success(res, "Logout successful");
});

module.exports = {
  register,
  verifyEmailOtp,
  resendEmailOtp,
  login,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
};
