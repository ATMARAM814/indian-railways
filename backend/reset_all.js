/**
 * FULL SYSTEM RESET SCRIPT
 * ========================
 * This script does the following:
 *   1. Deletes ALL taken-assessment records so every employee page shows nothing.
 *      (question_bank and yes_no_questions are NOT touched — only assessment data)
 *   2. Resets PME done / REF done dates to NULL for all profiles.
 *   3. Resets every user's password to their own HRMS ID.
 *      (must_change_password is set to true so they are prompted to change it)
 *
 * SAFE TO RUN MULTIPLE TIMES (idempotent).
 *
 * Run with: node reset_all.js
 */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function resetAll() {
    const client = await pool.connect();
    try {
        console.log("==========================================================");
        console.log("  RAILWAY EVALUATION SYSTEM — FULL RESET SCRIPT");
        console.log("==========================================================\n");

        await client.query("BEGIN");

        // ------------------------------------------------------------------
        // STEP 1 — Delete all assessment-related data
        // Tables affected (child → parent order to respect FK constraints):
        //   assessment_mcq_answers
        //   assessment_mcq_questions
        //   assessment_yes_no_answers
        //   employee_categories          ← reset so no stale category exists
        //   assessments
        //
        // NOT touched: question_bank, yes_no_questions, evaluation_sections
        // ------------------------------------------------------------------

        console.log("STEP 1: Deleting all assessment data...");

        const { rowCount: answerRows } = await client.query(
            "DELETE FROM assessment_mcq_answers"
        );
        console.log(`  ✓ Deleted ${answerRows} MCQ answer rows.`);

        const { rowCount: questionRows } = await client.query(
            "DELETE FROM assessment_mcq_questions"
        );
        console.log(`  ✓ Deleted ${questionRows} MCQ question (per-assessment) rows.`);

        const { rowCount: yesNoRows } = await client.query(
            "DELETE FROM assessment_yes_no_answers"
        );
        console.log(`  ✓ Deleted ${yesNoRows} Yes/No answer rows.`);

        const { rowCount: categoryRows } = await client.query(
            "DELETE FROM employee_categories"
        );
        console.log(`  ✓ Deleted ${categoryRows} employee category rows.`);

        const { rowCount: assessmentRows } = await client.query(
            "DELETE FROM assessments"
        );
        console.log(`  ✓ Deleted ${assessmentRows} assessment records.`);

        // ------------------------------------------------------------------
        // STEP 2 — Reset PME done / REF done for all profiles
        // ------------------------------------------------------------------

        console.log("\nSTEP 2: Resetting PME / REF done dates...");

        const { rowCount: pmeRows } = await client.query(`
      UPDATE profiles
      SET pme_done = NULL, ref_done = NULL
      WHERE pme_done IS NOT NULL OR ref_done IS NOT NULL
    `);
        console.log(`  ✓ Reset PME / REF done dates for ${pmeRows} profiles.`);

        await client.query("COMMIT");
        console.log("\n  All assessment data committed successfully.\n");

        // ------------------------------------------------------------------
        // STEP 3 — Reset every user password to their HRMS ID
        // We do this OUTSIDE the transaction because bcrypt is CPU-intensive
        // and we want clean, individual updates.
        // ------------------------------------------------------------------

        console.log("STEP 3: Resetting all user passwords to their HRMS ID...");

        // Fetch all user credentials joined with profile to get hrms_id
        const usersRes = await pool.query(`
      SELECT uc.id AS cred_id, uc.profile_id, p.hrms_id
      FROM user_credentials uc
      JOIN profiles p ON p.id = uc.profile_id
      WHERE p.hrms_id IS NOT NULL AND p.hrms_id <> ''
    `);

        const users = usersRes.rows;
        console.log(`  Found ${users.length} user credentials to reset.\n`);

        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            try {
                const passwordHash = await bcrypt.hash(user.hrms_id, 10);
                await pool.query(
                    `
          UPDATE user_credentials
          SET
            password_hash = $1,
            must_change_password = true,
            failed_login_attempts = 0,
            is_locked = false
          WHERE id = $2
          `,
                    [passwordHash, user.cred_id]
                );
                successCount++;
                process.stdout.write(`\r  Progress: ${successCount}/${users.length} passwords reset...`);
            } catch (err) {
                failCount++;
                console.error(`\n  ✗ Failed to reset password for HRMS ID "${user.hrms_id}":`, err.message);
            }
        }

        console.log(`\n\n  ✓ Successfully reset ${successCount} passwords.`);
        if (failCount > 0) {
            console.log(`  ✗ Failed to reset ${failCount} passwords (see errors above).`);
        }

        console.log("\n==========================================================");
        console.log("  RESET COMPLETE");
        console.log("  - All assessments deleted (question bank untouched)");
        console.log("  - PME / REF done dates cleared");
        console.log("  - All user passwords set to their own HRMS ID");
        console.log("  - must_change_password = true for all users");
        console.log("==========================================================\n");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("\n✗ FATAL ERROR — transaction rolled back:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

resetAll();
