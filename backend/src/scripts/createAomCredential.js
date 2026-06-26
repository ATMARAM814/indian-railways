require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../config/database");

async function createAomCredential() {
  try {
    const hrmsId = "AOM001";
    const password = "AOM001";

    const profileResult = await pool.query(
      `
      SELECT id
      FROM profiles
      WHERE hrms_id = $1
      `,
      [hrmsId]
    );

    if (profileResult.rows.length === 0) {
      throw new Error("AOM profile not found");
    }

    const profileId = profileResult.rows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO user_credentials (
        profile_id,
        hrms_id,
        password_hash,
        must_change_password
      )
      VALUES ($1, $2, $3, true)
      ON CONFLICT (hrms_id)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        must_change_password = true
      `,
      [profileId, hrmsId, passwordHash]
    );

    console.log("AOM credential created successfully");
  } catch (error) {
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

createAomCredential();