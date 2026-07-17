const express = require("express");
const router = express.Router();

const {
  authenticate,
  enforcePasswordChange,
} = require("../../middleware/auth.middleware");

const { authorize } = require("../../middleware/role.middleware");

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
  getEmployeePmeRefStatusController,
} = require("./user.controller");

// Roles authorized to manage workforce users
const workforceRoles = [
  "SUPER_ADMIN",
  "AOM",
  "TI",
  "SMS",
  "Station Master Supervisor",
  "STATION MASTER SUPERVISOR",
  "SS",
  "SM",
  "Cabin Master",
  "CABIN MASTER"
];

// All roles in the system, including candidates who can access their own profile details
const allRoles = [
  ...workforceRoles,
  "PM",
  "TM",
  "Shunting Master",
  "SHUNTING MASTER",
  "SHM"
];

router.post(
  "/",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  createUserController
);

router.get(
  "/",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  listUsersController
);

router.get(
  "/workforce-presence",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  getWorkforcePresenceController
);

router.get(
  "/employee-pme-ref-status",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  getEmployeePmeRefStatusController
);

router.get(
  "/:id",
  authenticate,
  enforcePasswordChange,
  authorize(...allRoles),
  getUserDetailsController
);

router.put(
  "/:id",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  updateUserController
);

router.patch(
  "/:id/deactivate",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  deactivateUserController
);

router.post(
  "/:id/reset-password",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  resetPasswordController
);

router.patch(
  "/:id/activate",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  activateUserController
);

router.post(
  "/:id/transfer",
  authenticate,
  enforcePasswordChange,
  authorize(...workforceRoles),
  transferUserController
);

module.exports = router;