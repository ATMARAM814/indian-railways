const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const {
  createUserController,
  listUsersController,
  getUserDetailsController,
  updateUserController,
  deactivateUserController,
  resetPasswordController,
  activateUserController,
  transferUserController,
  getWorkforcePresenceController,
} = require("./user.controller");

router.post(
  "/",
  authenticate,
  enforcePasswordChange,
  createUserController
);

router.get(
  "/",
  authenticate,
  enforcePasswordChange,
  listUsersController
);

router.get(
  "/workforce-presence",
  authenticate,
  enforcePasswordChange,
  getWorkforcePresenceController
);

router.get(
  "/:id",
  authenticate,
  enforcePasswordChange,
  getUserDetailsController
);

router.put(
  "/:id",
  authenticate,
  enforcePasswordChange,
  updateUserController
);

router.patch(
  "/:id/deactivate",
  authenticate,
  enforcePasswordChange,
  deactivateUserController
);

router.post(
  "/:id/reset-password",
  authenticate,
  enforcePasswordChange,
  resetPasswordController
);

router.patch(
  "/:id/activate",
  authenticate,
  enforcePasswordChange,
  activateUserController,
);

router.post(
  "/:id/transfer",
  authenticate,
  enforcePasswordChange,
  transferUserController
);

module.exports = router;