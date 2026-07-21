const pool = require("../../config/database");

async function findUserByHrmsId(hrmsId) {
  const query = `
    SELECT
      p.id,
      p.full_name,
      p.hrms_id,
      p.designation,
      p.status,
      r.name as role
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    WHERE UPPER(p.hrms_id) = UPPER($1)
  `;

  const result = await pool.query(query, [hrmsId]);

  return result.rows[0];
}

async function findUserByPhone(phone) {
  const query = `
    SELECT
      p.id,
      p.full_name,
      p.hrms_id,
      p.phone,
      p.status,
      r.name as role
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    WHERE p.phone = $1
  `;

  const result = await pool.query(query, [phone]);

  return result.rows[0];
}

async function findCredentialByHrmsId(hrmsId) {
  const query = `
    SELECT *
    FROM user_credentials
    WHERE UPPER(hrms_id) = UPPER($1)
  `;

  const result = await pool.query(query, [hrmsId]);

  return result.rows[0];
}

async function findUserById(userId) {
  const query = `
    SELECT
      p.id,
      p.full_name,
      p.hrms_id,
      p.phone,
      p.designation,
      p.status,
      r.name as role,
      uc.must_change_password as "mustChangePassword"
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    LEFT JOIN user_credentials uc ON uc.profile_id = p.id
    WHERE p.id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

async function updateUserPassword(userId, passwordHash) {
  const query = `
    UPDATE user_credentials
    SET 
      password_hash = $1,
      must_change_password = false,
      failed_login_attempts = 0,
      is_locked = false
    WHERE profile_id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [passwordHash, userId]);
  return result.rows[0];
}

module.exports = {
  findUserByHrmsId,
  findUserByPhone,
  findCredentialByHrmsId,
  findUserById,
  updateUserPassword,
};