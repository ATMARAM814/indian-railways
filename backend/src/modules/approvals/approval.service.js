const {
  getPendingApprovalsForUser,
  approveAssessment,
  rejectAssessment,
  modifyAssessmentDuringApproval,
} = require("./approval.repository");

const {
  getAssessmentById,
  hasStationSupervisor,
} = require("../assessments/assessment.repository");

const {
  getCategoryByCode,
  assignUserCategory,
} = require("../users/user.repository");

const { logAction } = require("../audit/audit.service");

async function listPendingApprovals(userId, role) {
  return await getPendingApprovalsForUser(userId, role);
}

async function validateApprovalHierarchy(
  assessmentId,
  approverId,
  approverRole
) {
  const assessment =
    await getAssessmentById(assessmentId);

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  if (approverRole === "SUPER_ADMIN") {
    throw new Error("Super Admin does not have authority to approve assessments. Approvals must be processed by designated operating authorities (AOM, SMS, or TI).");
  }

  const pool = require("../../config/database");
  const assessedRole = assessment.assessed_role_code;
  const isSmsOrTiApprovable = [
    "PM", "Pointsman",
    "Shunting Master", "SHUNTING MASTER", "SHM",
    "SS", "Station Master Incharge", "STATION MASTER INCHARGE", "Station Superintendent",
  ].includes(assessedRole);
  const isSmsRole = [
    "SMS",
    "STATION MASTER SUPERVISOR",
    "Station Master Supervisor",
    "Station Master Supervisior",
    "Station Master Supervisio",
  ].includes(approverRole);
  const aomApprovableRoles = [
    "SM", "Station Master",
    "TM", "Train Manager",
    "TI", "Traffic Inspector",
    "Station Master Supervisor", "SMS", "STATION MASTER SUPERVISOR",
    "Cabin Master", "CABIN MASTER",
    "SS", "Station Master Incharge", "STATION MASTER INCHARGE", "Station Superintendent",
  ];

  // Train Managers must ALWAYS be approved by AOM (or SUPER_ADMIN)
  if (["TM", "Train Manager"].includes(assessedRole)) {
    if (approverRole !== "AOM") {
      throw new Error("Only an Assistant Operations Manager (AOM) is authorized to approve Train Manager assessments.");
    }
    return assessment;
  }

  // AOM approves SM, TM, TI, SMS, SS, Cabin Master regardless of prior transfer reporting_officer_id
  if (approverRole === "AOM") {
    const isCandSupervisory = aomApprovableRoles.includes(assessedRole) || assessment.assessor_user_id === approverId;
    if (!isCandSupervisory) {
      const candRoleRes = await pool.query(
        "SELECT r.name FROM profiles p JOIN roles r ON r.id = p.role_id WHERE p.id = $1",
        [assessment.assessed_user_id]
      );
      const candRole = candRoleRes.rows[0]?.name;
      if (!aomApprovableRoles.includes(candRole)) {
        throw new Error(
          "AOM can approve only SM/TM/TI/Station Master Supervisor/SM Incharge/Cabin Master assessments"
        );
      }
    }
    return assessment;
  }

  // Station Master Supervisor approves PM and Shunting Master posted at their current station
  if (isSmsRole) {
    if (!isSmsOrTiApprovable) {
      throw new Error(`${approverRole} can approve only PM/Shunting Master assessments`);
    }
    const stationMatchRes = await pool.query(
      `SELECT 1
       FROM staff_station_postings ssp_cand
       JOIN staff_station_postings ssp_approver
         ON ssp_approver.station_id = ssp_cand.station_id
       WHERE ssp_cand.profile_id = $1
         AND ssp_cand.is_current = true
         AND ssp_approver.profile_id = $2
         AND ssp_approver.is_current = true
       LIMIT 1`,
      [assessment.assessed_user_id, approverId]
    );
    if (stationMatchRes.rowCount === 0) {
      throw new Error(
        "You are not authorized to approve assessments for staff outside your assigned station."
      );
    }
    return assessment;
  }

  // TI approves PM and Shunting Master within their TI_AREA when no active SMS is assigned to that station
  if (approverRole === "TI") {
    if (!isSmsOrTiApprovable) {
      throw new Error(`${approverRole} can approve only PM/Shunting Master assessments`);
    }
    const hasSms = await hasStationSupervisor(assessment.assessed_user_id);
    if (hasSms) {
      throw new Error(
        "This station has an assigned Station Master Supervisor. TI cannot approve assessments for this station."
      );
    }
    const checkJurisdictionRes = await pool.query(
      `SELECT 1 
       FROM staff_station_postings ssp
       JOIN station_assignments sa ON sa.station_id = ssp.station_id 
         AND sa.assignment_type = 'TI_AREA' 
         AND (sa.assigned_to IS NULL OR sa.assigned_to >= CURRENT_DATE)
       WHERE ssp.profile_id = $1 
         AND ssp.is_current = true 
         AND sa.profile_id = $2`,
      [assessment.assessed_user_id, approverId]
    );
    if (checkJurisdictionRes.rowCount === 0) {
      throw new Error(
        "You are not authorized to approve assessments for staff outside your assigned jurisdiction/stations."
      );
    }
    return assessment;
  }

  // Fallback for explicit reporting officer when no active station SMS supersedes them
  const checkReportingRes = await pool.query(
    "SELECT reporting_officer_id FROM profiles WHERE id = $1",
    [assessment.assessed_user_id]
  );
  const reportingOfficerId = checkReportingRes.rows[0]?.reporting_officer_id;
  if (reportingOfficerId && reportingOfficerId === approverId && !(isSmsOrTiApprovable && (await hasStationSupervisor(assessment.assessed_user_id)))) {
    return assessment;
  }

  throw new Error("You are not authorized to approve assessments");
}

async function approveAssessmentService(
  assessmentId,
  approverId,
  approverRole,
  approvalRemark
) {
  await validateApprovalHierarchy(
    assessmentId,
    approverId,
    approverRole
  );

  const assessment =
    await approveAssessment(
      assessmentId,
      approverId,
      approvalRemark || null
    );

  if (!assessment) {
    throw new Error(
      "Assessment not found or already processed"
    );
  }

  const isPmeUnfit = (assessment.pme_status || '').toLowerCase() === 'unfit';

  if (!isPmeUnfit) {
    let categoryCode = 'D';
    const pct = Number(assessment.percentage || 0);
    const mcqScore = Number(assessment.mcq_score || 0);
    const alertnessScore = Number(assessment.alertness_score || 0);

    if (assessment.alcoholic_status === 'Alcoholic' || pct <= 25) {
      categoryCode = 'D';
    } else if (mcqScore < 15 || alertnessScore < 15) {
      categoryCode = 'C';
    } else {
      if (pct >= 80) {
        categoryCode = 'A';
      } else if (pct >= 50) {
        categoryCode = 'B';
      } else if (pct >= 26) {
        categoryCode = 'C';
      } else {
        categoryCode = 'D';
      }
    }

    const catObj = await getCategoryByCode(categoryCode);
    if (catObj) {
      await assignUserCategory({
        profileId: assessment.assessed_user_id,
        categoryId: catObj.id,
        assignedBy: approverId,
      });
    }
  }

  // Auto-archive counseling checklist if all subjects are completed
  try {
    const counselingDb = require("../counseling/counseling.repository");
    const subjects = await counselingDb.getCounselingSubjectsForRoleDb(assessment.assessed_role_code);
    const statuses = await counselingDb.getCandidateCounselingStatusesDb(assessment.assessed_user_id);
    const statusMap = {};
    statuses.forEach((s) => {
      statusMap[s.subjectId] = s;
    });

    const allCompleted = subjects.length > 0 && subjects.every((sub) => {
      const statusRecord = statusMap[sub.id];
      return statusRecord && statusRecord.isCompleted === true;
    });

    if (allCompleted) {
      // Archive counseling statuses to history
      await counselingDb.insertCounselingHistoryDb({
        profileId: assessment.assessed_user_id,
        completedBy: approverId,
        assessmentId: assessmentId
      });
      // Clear active statuses
      await counselingDb.clearCandidateCounselingStatusesDb(assessment.assessed_user_id);
      
      // Update status of any active manual schedule for this candidate to 'completed'
      const pool = require("../../config/database");
      await pool.query(
        "UPDATE manual_counseling_schedules SET status = 'completed', completed_at = NOW() WHERE profile_id = $1 AND status = 'scheduled'",
        [assessment.assessed_user_id]
      );
    }
  } catch (counselingErr) {
    console.error("Failed to auto-archive counseling status on assessment approval:", counselingErr);
  }

  await logAction(
    approverId,
    "ASSESSMENT_APPROVED",
    "ASSESSMENT",
    assessmentId,
    null,
    assessment,
    approvalRemark || "Assessment approved"
  );

  return assessment;
}

async function rejectAssessmentService(
  assessmentId,
  approverId,
  approverRole,
  rejectionReason
) {
    await validateApprovalHierarchy(
    assessmentId,
    approverId,
    approverRole
  );
  const assessment =
    await rejectAssessment(
      assessmentId,
      approverId,
      rejectionReason
    );

  if (!assessment) {
    throw new Error(
      "Assessment not found or already processed"
    );
  }

  await logAction(
    approverId,
    "ASSESSMENT_REJECTED",
    "ASSESSMENT",
    assessmentId,
    null,
    assessment,
    rejectionReason || "Assessment rejected"
  );

  return assessment;
}

async function modifyAssessmentService(
  assessmentId,
  approverId,
  approverRole,
  scores,
  modificationRemark
) {
  await validateApprovalHierarchy(
    assessmentId,
    approverId,
    approverRole
  );

  const oldAssessment = await getAssessmentById(assessmentId);
  if (!oldAssessment) {
    throw new Error("Assessment not found");
  }

  const oldScore = {
    alertnessScore: oldAssessment.alertness_score,
    safetyRecordScore: oldAssessment.safety_record_score,
    leadershipScore: oldAssessment.leadership_score,
    disciplineScore: oldAssessment.discipline_score,
    appearanceScore: oldAssessment.appearance_score,
    totalScore: oldAssessment.total_score,
    percentage: oldAssessment.percentage,
  };

  const assessment =
    await modifyAssessmentDuringApproval(
      assessmentId,
      approverId,
      scores,
      modificationRemark
    );

  if (!assessment) {
    throw new Error(
      "Assessment not found or not pending approval"
    );
  }

  const newScore = {
    alertnessScore: assessment.alertness_score,
    safetyRecordScore: assessment.safety_record_score,
    leadershipScore: assessment.leadership_score,
    disciplineScore: assessment.discipline_score,
    appearanceScore: assessment.appearance_score,
    totalScore: assessment.total_score,
    percentage: assessment.percentage,
  };

  await logAction(
    approverId,
    "ASSESSMENT_MODIFIED",
    "ASSESSMENT",
    assessmentId,
    oldScore,
    newScore,
    modificationRemark || "Assessment modified during approval"
  );

  return assessment;
}

module.exports = {
  listPendingApprovals,
  approveAssessmentService,
  rejectAssessmentService,
  modifyAssessmentService,
};