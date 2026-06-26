const pool = require("../../config/database");

async function getPendingApprovalsForUser(userId, role) {
  const query = `
    SELECT
      a.id,
      a.status,
      a.approval_status,
      a.assessed_role_code,
      a.assessor_role_code,

      assessed.full_name as assessed_name,
      assessed.hrms_id as assessed_hrms_id,

      assessor.full_name as assessor_name,
      assessor.hrms_id as assessor_hrms_id,

      a.total_score,
      a.percentage,
      a.evaluated_at,
      a.assessment_type,
      a.assessment_cycle,
      s.station_name,
      s.station_code

    FROM assessments a
    JOIN profiles assessed
      ON assessed.id = a.assessed_user_id
    JOIN profiles assessor
      ON assessor.id = a.assessor_user_id
    LEFT JOIN staff_station_postings ssp
      ON ssp.profile_id = assessed.id AND ssp.is_current = true
    LEFT JOIN stations s
      ON s.id = ssp.station_id
    WHERE a.status = 'completed'
      AND a.approval_status = 'pending_approval'
      AND (
        (assessed.reporting_officer_id = $2)
        OR
        (assessed.reporting_officer_id IS NULL AND (
          ($1 = 'TI' 
           AND a.assessed_role_code IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM')
           AND NOT EXISTS (
             SELECT 1 
             FROM staff_station_postings ssp_sms
             JOIN profiles p_sms ON p_sms.id = ssp_sms.profile_id
             JOIN roles r_sms ON r_sms.id = p_sms.role_id
             WHERE ssp_sms.station_id = ssp.station_id 
               AND ssp_sms.is_current = true 
               AND r_sms.name IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Station Master Supervisior', 'Station Master Supervisio')
           )
          )
          OR
          ($1 IN ('Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS') 
           AND a.assessed_role_code IN ('PM', 'Shunting Master', 'SHUNTING MASTER', 'SHM') 
           AND ssp.station_id = (SELECT station_id FROM staff_station_postings WHERE profile_id = $2 AND is_current = true LIMIT 1)
          )
          OR
          ($1 = 'AOM' AND a.assessed_role_code IN ('SM', 'TM', 'TI', 'SS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR', 'SMS', 'Cabin Master', 'CABIN MASTER'))
        ))
      )
    ORDER BY a.evaluated_at DESC;
  `;

  const result = await pool.query(query, [
    role,
    userId
  ]);

  return result.rows;
}

async function approveAssessment(
  assessmentId,
  approverId,
  approvalRemark
) {
  const query = `
    UPDATE assessments
    SET
      approval_status = 'approved',
      approved_by = $2,
      approved_at = now(),
      approval_remark = $3
    WHERE id = $1
      AND approval_status = 'pending_approval'
    RETURNING *;
  `;

  const result = await pool.query(query, [
    assessmentId,
    approverId,
    approvalRemark,
  ]);

  return result.rows[0];
}

async function rejectAssessment(
  assessmentId,
  approverId,
  rejectionReason
) {
  const query = `
    UPDATE assessments
    SET
      approval_status = 'rejected',
      rejected_by = $2,
      rejected_at = now(),
      rejection_reason = $3
    WHERE id = $1
      AND approval_status = 'pending_approval'
    RETURNING *;
  `;

  const result = await pool.query(query, [
    assessmentId,
    approverId,
    rejectionReason,
  ]);

  return result.rows[0];
}

async function modifyAssessmentDuringApproval(
  assessmentId,
  approverId,
  scores,
  modificationRemark
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
      UPDATE assessments
      SET
        alertness_score = $1::int,
        safety_record_score = $2::int,
        leadership_score = $3::int,
        discipline_score = $4::int,
        appearance_score = $5::int,

        evaluation_score =
          $1::int + $2::int + $3::int + $4::int + $5::int,

        yes_no_score =
          $1::int + $2::int + $3::int + $4::int + $5::int,

        total_score =
          mcq_score + $1::int + $2::int + $3::int + $4::int + $5::int,

        percentage =
          ((mcq_score + $1::int + $2::int + $3::int + $4::int + $5::int)::numeric / COALESCE(NULLIF(max_marks, 0), 100)) * 100,

        modified_by = $6,
        modified_at = now(),
        modification_remark = $7
      WHERE id = $8
        AND approval_status = 'pending_approval'
      RETURNING *;
    `;

    const result = await client.query(query, [
      scores.alertnessScore || 0,
      scores.safetyRecordScore || 0,
      scores.leadershipScore || 0,
      scores.disciplineScore || 0,
      scores.appearanceScore || 0,
      approverId,
      modificationRemark || null,
      assessmentId,
    ]);

    const updatedAssessment = result.rows[0];
    if (!updatedAssessment) {
      await client.query("ROLLBACK");
      return null;
    }

    // Update individual yes/no answers to match modified score
    const answersQuery = `
      SELECT aya.question_id, aya.section_code, ynq.marks_per_question
      FROM assessment_yes_no_answers aya
      JOIN yes_no_questions ynq ON ynq.id = aya.question_id
      WHERE aya.assessment_id = $1;
    `;
    const answersRes = await client.query(answersQuery, [assessmentId]);
    const answers = answersRes.rows;

    const grouped = {};
    for (const ans of answers) {
      if (!grouped[ans.section_code]) {
        grouped[ans.section_code] = [];
      }
      grouped[ans.section_code].push(ans);
    }

    const sectionScores = {
      ALERTNESS: scores.alertnessScore || 0,
      SAFETY_RECORD: scores.safetyRecordScore || 0,
      LEADERSHIP: scores.leadershipScore || 0,
      DISCIPLINE: scores.disciplineScore || 0,
      APPEARANCE: scores.appearanceScore || 0
    };

    for (const sectionCode of Object.keys(sectionScores)) {
      const secAnswers = grouped[sectionCode] || [];
      if (secAnswers.length === 0) continue;

      const newScore = sectionScores[sectionCode];
      const marksPerQ = secAnswers[0].marks_per_question || 1;
      const numYes = Math.min(secAnswers.length, Math.max(0, Math.round(newScore / marksPerQ)));

      secAnswers.sort((a, b) => a.question_id.localeCompare(b.question_id));

      for (let i = 0; i < secAnswers.length; i++) {
        const ans = secAnswers[i];
        const isYes = i < numYes;
        const marksAwarded = isYes ? marksPerQ : 0;

        await client.query(`
          UPDATE assessment_yes_no_answers
          SET answer = $1, marks_awarded = $2
          WHERE assessment_id = $3 AND question_id = $4;
        `, [isYes, marksAwarded, assessmentId, ans.question_id]);
      }
    }

    await client.query("COMMIT");
    return updatedAssessment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPendingApprovalsForUser,
  approveAssessment,
  rejectAssessment,
  modifyAssessmentDuringApproval,
};