const bcrypt = require("bcrypt");
const pool = require("../config/database");

async function generateCredentials() {
  try {
    const profiles = await pool.query(`
      SELECT id, hrms_id
      FROM profiles
    `);

    for (const profile of profiles.rows) {
      const passwordHash = await bcrypt.hash(
        profile.hrms_id,
        10
      );

      await pool.query(
        `
        INSERT INTO user_credentials (
          profile_id,
          hrms_id,
          password_hash,
          must_change_password
        )
        VALUES ($1, $2, $3, true)
        `,
        [
          profile.id,
          profile.hrms_id,
          passwordHash,
        ]
      );
    }

    console.log(
      `Created ${profiles.rows.length} credentials`
    );

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

generateCredentials();