const express = require("express");
const router = express.Router();

const {
  loginController,
  meController,
  changePasswordController,
  sendOtpController,
  verifyAndResetPasswordController,
} = require("./auth.controller");

const {
  authenticate,
} = require("../../middleware/auth.middleware");

router.get(
  "/me",
  authenticate,
  meController
);

router.post("/login", loginController);

router.post(
  "/change-password",
  authenticate,
  changePasswordController
);

router.post(
  "/forgot-password/send-otp",
  sendOtpController
);

router.post(
  "/forgot-password/verify-reset",
  verifyAndResetPasswordController
);

module.exports = router;