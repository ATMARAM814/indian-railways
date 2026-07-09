require('../backend/node_modules/dotenv').config({ path: 'backend/.env' });
const pool = require('../backend/src/config/database');

async function inspectCandidate() {
  try {
    const candidateId = '670a9be7-d755-4eaf-abf5-3a9890812f3f';
    
    // Check candidate base details
    const resBase = await pool.query('SELECT * FROM profiles WHERE id = $1', [candidateId]);
    console.log("Candidate Base Profile:", resBase.rows);

    // Check candidate postings
    const resPost = await pool.query('SELECT * FROM staff_station_postings WHERE profile_id = $1', [candidateId]);
    console.log("Candidate Postings:", resPost.rows);

    // Check assessments
    const resAssess = await pool.query('SELECT id, status, approval_status, percentage, created_at, evaluated_at FROM assessments WHERE assessed_user_id = $1', [candidateId]);
    console.log("Candidate Assessments:", resAssess.rows);

    // Run the counseling repository query
    const { getCandidateDetailsDb } = require('../backend/src/modules/counseling/counseling.repository');
    const result = await getCandidateDetailsDb(candidateId);
    console.log("getCandidateDetailsDb Result:", result);

  } catch (error) {
    console.error("Error inspecting:", error);
  } finally {
    process.exit(0);
  }
}

inspectCandidate();
