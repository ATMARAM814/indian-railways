require('../backend/node_modules/dotenv').config({ path: 'backend/.env' });
const pool = require('../backend/src/config/database');

async function runTest() {
  try {
    console.log("Truncating counseling_subjects table to restart seeding...");
    await pool.query('TRUNCATE TABLE counseling_subjects CASCADE');

    console.log("Loading repository to trigger migration and seeding...");
    // Await the migration query directly in our test script so we know it finishes
    const { getCandidateDetailsDb } = require('../backend/src/modules/counseling/counseling.repository');
    
    // Give it a few seconds to run the queries
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const res = await pool.query('SELECT COUNT(*)::int FROM counseling_subjects');
    console.log("Final seeded subjects count in database:", res.rows[0].count);

    const rolesCount = await pool.query('SELECT role_code, COUNT(*) FROM counseling_subjects GROUP BY role_code');
    console.log("Count by role:", rolesCount.rows);
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    process.exit(0);
  }
}

runTest();
