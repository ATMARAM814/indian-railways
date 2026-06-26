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

// Temporary secure endpoint to reset all passwords to hrms_id
router.get("/reset-all-passwords-to-hrmsid", async (req, res, next) => {
  const { secret } = req.query;
  if (secret !== "Railway_Reset_Key_2026_Secure") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const pool = require("../../config/database");
  const bcrypt = require("bcrypt");

  try {
    console.log("[Migration] Beginning password reset to HRMS ID for all users...");
    const profilesRes = await pool.query("SELECT id, hrms_id FROM profiles");
    const profiles = profilesRes.rows;
    const results = [];

    for (const profile of profiles) {
      const hrmsId = profile.hrms_id;
      const profileId = profile.id;

      if (!hrmsId) continue;

      const hash = await bcrypt.hash(hrmsId, 10);

      // Check if credentials exist
      const checkRes = await pool.query("SELECT 1 FROM user_credentials WHERE profile_id = $1", [profileId]);
      if (checkRes.rows.length > 0) {
        await pool.query(
          `UPDATE user_credentials 
           SET password_hash = $1, must_change_password = false, failed_login_attempts = 0, is_locked = false 
           WHERE profile_id = $2`,
          [hash, profileId]
        );
        results.push({ hrmsId, action: "updated" });
      } else {
        await pool.query(
          `INSERT INTO user_credentials (profile_id, hrms_id, password_hash, must_change_password, failed_login_attempts, is_locked)
           VALUES ($1, $2, $3, false, 0, false)`,
          [profileId, hrmsId, hash]
        );
        results.push({ hrmsId, action: "inserted" });
      }
    }

    console.log(`[Migration] Successfully reset ${results.length} passwords.`);
    res.json({
      success: true,
      message: `Reset ${results.length} passwords successfully.`,
      details: results
    });
  } catch (error) {
    console.error("[Migration Error] Failed to reset passwords:", error);
    next(error);
  }
});

module.exports = router;