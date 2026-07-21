const {
  login,
  getMe,
  changePasswordService,
  sendPasswordResetOtpService,
  verifyResetOtpService,
} = require("./auth.service");

const { logAction } = require("../audit/audit.service");

async function loginController(req, res) {
  const { hrmsId, password } = req.body;
  try {
    const user = await login(
      hrmsId,
      password
    );

    await logAction({
      performedBy: user.user.id,
      actionType: "LOGIN_SUCCESS",
      moduleName: "Auth",
      entityType: "USER",
      entityId: user.user.id,
      entityName: user.user.fullName,
      severity: "LOW",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      remarks: `User ${user.user.fullName} (${hrmsId}) successfully logged in.`
    });

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    await logAction({
      performedBy: null,
      actionType: "LOGIN_FAILED",
      moduleName: "Auth",
      entityType: "USER",
      severity: "CRITICAL",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      remarks: `Failed login attempt for HRMS ID: ${hrmsId || "Unknown"}. Reason: ${error.message}`
    });

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

async function meController(req, res) {
  try {
    const user = await getMe(req.user.userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

async function changePasswordController(req, res) {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirm password do not match");
    }

    const result = await changePasswordService(
      req.user.userId,
      req.user.hrmsId,
      oldPassword,
      newPassword
    );

    await logAction({
      performedBy: req.user.userId,
      actionType: "PASSWORD_CHANGED",
      moduleName: "Auth",
      entityType: "USER",
      entityId: req.user.userId,
      severity: "HIGH",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      remarks: `User changed password successfully.`
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function sendOtpController(req, res) {
  try {
    const { phone } = req.body;
    const result = await sendPasswordResetOtpService(phone);

    await logAction({
      performedBy: null,
      actionType: "FORGOT_PASSWORD_OTP_SENT",
      moduleName: "Auth",
      entityType: "USER",
      severity: "MEDIUM",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      remarks: `Forgot password OTP request sent to mobile number: ${phone}`
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function verifyAndResetPasswordController(req, res) {
  try {
    const { phone, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirm password do not match");
    }

    const result = await verifyResetOtpService(
      phone,
      otp,
      newPassword
    );

    await logAction({
      performedBy: null,
      actionType: "PASSWORD_RESET_BY_OTP",
      moduleName: "Auth",
      entityType: "USER",
      severity: "HIGH",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      remarks: `Password successfully reset via mobile OTP verification for phone: ${phone}`
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  loginController,
  meController,
  changePasswordController,
  sendOtpController,
  verifyAndResetPasswordController,
};