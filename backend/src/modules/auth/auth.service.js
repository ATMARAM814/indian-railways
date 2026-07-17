  const jwt = require("jsonwebtoken");
  const bcrypt = require("bcrypt");
  const { sendOTP, verifyOTP } = require("../../utils/msg91");

  const {
    findUserByHrmsId,
    findUserByPhone,
    findCredentialByHrmsId,
    findUserById,
    updateUserPassword,
    updateUserLockoutStatus,
  } = require("./auth.repository");

  function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  // Enforce strong password complexity: at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
    throw new Error("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
  }
}

async function login(hrmsId, password) {
  const genericError = new Error("Invalid HRMS ID or password");

  // Prevent timing attacks by executing a dummy bcrypt comparison if user doesn't exist
  const dummyHash = "$2b$10$DummyHashPlaceholderForTimingProtectionDoNotUseRealOneHere";

  const user = await findUserByHrmsId(hrmsId);
  const credential = await findCredentialByHrmsId(hrmsId);

  if (!user || !credential) {
    // Run dummy compare to match processing time of valid user
    await bcrypt.compare(password, dummyHash);
    throw genericError;
  }

  // Check if account is currently locked out
  if (credential.is_locked || (credential.locked_until && new Date(credential.locked_until) > new Date())) {
    const lockedUntil = new Date(credential.locked_until);
    const now = new Date();
    if (lockedUntil > now) {
      const waitMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
      throw new Error(`Account temporarily locked. Please try again after ${waitMinutes} minutes.`);
    } else {
      // Lock has expired, reset it
      await updateUserLockoutStatus(user.id, 0, false, null);
      credential.is_locked = false;
      credential.failed_login_attempts = 0;
    }
  }

  if (user.status !== "active") {
    throw new Error("User account is inactive");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    credential.password_hash
  );

  if (!isPasswordValid) {
    const newFailedAttempts = (credential.failed_login_attempts || 0) + 1;
    if (newFailedAttempts >= 5) {
      const lockUntilDate = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      await updateUserLockoutStatus(user.id, newFailedAttempts, true, lockUntilDate);
      throw new Error("Too many failed login attempts. Your account has been temporarily locked for 15 minutes.");
    } else {
      await updateUserLockoutStatus(user.id, newFailedAttempts, false, null);
      throw genericError;
    }
  }

  // Login successful, reset lockout state
  await updateUserLockoutStatus(user.id, 0, false, null);

  const token = jwt.sign(
    {
      userId: user.id,
      hrmsId: user.hrms_id,
      role: user.role,
      mustChangePassword: credential.must_change_password,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
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

  // Clear lockout attempts on password reset
  await updateUserLockoutStatus(user.id, 0, false, null);

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