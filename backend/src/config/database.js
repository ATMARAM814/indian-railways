const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 15), // Set production pool size limit
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT || 30000),
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONN_TIMEOUT || 5000),
  ssl: process.env.DB_SSL === "true" || process.env.NODE_ENV === "production" ? {
    rejectUnauthorized: false, // Required for Supabase/Railway connections
  } : false,
});

// Immediately verify connection on module load
pool.query("SELECT 1")
  .then(() => {
    console.log("[Database] Connection pool initialized and verified successfully.");
  })
  .catch((err) => {
    console.error("[Database] Critical Error: Failed to connect to the database on startup!", err.message);
    // Exit process in production to allow container restarts
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  });

// Wrap pool.query to log full query details and sanitize output in production
const originalQuery = pool.query.bind(pool);
pool.query = async function (text, params) {
  try {
    return await originalQuery(text, params);
  } catch (error) {
    // Log complete internal error on the server
    console.error("[Database Query Error]:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      query: typeof text === "string" ? text.trim() : (text?.text || "Unknown Query"),
      params,
    });

    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      // Return user-friendly messages for standard database violations
      if (error.code === "23505") { // unique_violation
        throw new Error("A record with this information already exists.");
      }
      if (error.code === "23503") { // foreign_key_violation
        throw new Error("Required related reference records were not found.");
      }
      throw new Error("An internal database error occurred.");
    }
    throw error;
  }
};

module.exports = pool;