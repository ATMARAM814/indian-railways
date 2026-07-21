  const jwt = require("jsonwebtoken");
  const bcrypt = require("bcrypt");
  const { sendOTP, verifyOTP } = require("../../utils/msg91");

  const {
    findUserByHrmsId,
    findUserByPhone,
    findCredentialByHrmsId,
    findUserById,
    updateUserPassword,
  } = require("./auth.repository");

  function validatePasswordStrength(password) {
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
  }

  async function login(hrmsId, password) {
    const user = await findUserByHrmsId(hrmsId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.status !== "active") {
      throw new Error("User account is inactive");
    }
    const credential =
      await findCredentialByHrmsId(hrmsId);

    if (!credential) {
      throw new Error("Credentials not found");
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        credential.password_hash
      );

    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        hrmsId: user.hrms_id,
        role: user.role,
        mustChangePassword: credential.must_change_password,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    return {
      user: {
        ...user,
        mustChangePassword: credential.must_change_password,
      },
      token,
    };
  }

  async function getMe(userId) {
    const user = await findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async function changePasswordService(userId, hrmsId, oldPassword, newPassword) {
    validatePasswordStrength(newPassword);

    const credential = await findCredentialByHrmsId(hrmsId);

    if (!credential) {
      throw new Error("Credentials not found");
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      credential.password_hash
    );

    if (!isPasswordValid) {
      throw new Error("Invalid old password");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(userId, passwordHash);

    return {
      message: "Password changed successfully",
    };
  }

  async function sendPasswordResetOtpService(phone) {
    if (!phone) {
      throw new Error("Phone number is required");
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      throw new Error("Mobile number not registered");
    }

    if (user.status !== "active") {
      throw new Error("User account is inactive");
    }

    await sendOTP(phone);

    return {
      message: "OTP sent successfully to registered mobile number",
    };
  }

  async function verifyResetOtpService(phone, otp, newPassword) {
    if (!phone || !otp || !newPassword) {
      throw new Error("Phone, OTP, and new password are required");
    }

    validatePasswordStrength(newPassword);

    const user = await findUserByPhone(phone);
    if (!user) {
      throw new Error("Mobile number not registered");
    }

    if (user.status !== "active") {
      throw new Error("User account is inactive");
    }

    await verifyOTP(phone, otp);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user.id, passwordHash);

    return {
      message: "Password reset successfully",
    };
  }

  module.exports = {
    login,
    getMe,
    changePasswordService,
    sendPasswordResetOtpService,
    verifyResetOtpService,
  };