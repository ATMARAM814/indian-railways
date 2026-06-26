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

  // Fetch candidate's reporting officer
  const pool = require("../../config/database");
  const checkReportingRes = await pool.query(
    "SELECT reporting_officer_id FROM profiles WHERE id = $1",
    [assessment.assessed_user_id]
  );
  const reportingOfficerId = checkReportingRes.rows[0]?.reporting_officer_id;

  // If a reporting officer is assigned, ONLY allow that specific officer to approve
  if (reportingOfficerId) {
    if (reportingOfficerId !== approverId) {
      throw new Error("Only the assigned reporting officer is authorized to approve this crew member's assessments.");
    }
    return assessment; // Bypass all other hierarchy rules
  }

  const assessedRole =
    assessment.assessed_role_code;

  if (
    (approverRole === "TI" || ["SMS", "STATION MASTER SUPERVISOR", "Station Master Supervisor"].includes(approverRole)) &&
    !["PM", "Shunting Master", "SHUNTING MASTER", "SHM"].includes(assessedRole)
  ) {
    throw new Error(
      `${approverRole} can approve only PM/Shunting Master assessments`
    );
  }

  if (approverRole === "TI") {
    const hasSms = await hasStationSupervisor(assessment.assessed_user_id);
    if (hasSms) {
      throw new Error(
        "This station has an assigned Station Master Supervisor. TI cannot approve assessments for this station."
      );
    }
  }

  if (
    approverRole === "AOM" &&
    !["SM", "TM", "TI", "SS", "Station Master Supervisor", "SMS", "STATION MASTER SUPERVISOR", "Cabin Master", "CABIN MASTER"].includes(
      assessedRole
    )
  ) {
    throw new Error(
      "AOM can approve only SM/TM/TI/SS/Station Master Supervisor/Cabin Master assessments"
    );
  }

  if (
    !["TI", "AOM", "Station Master Supervisor", "SMS", "STATION MASTER SUPERVISOR"].includes(
      approverRole
    )
  ) {
    throw new Error(
      "You are not authorized to approve assessments"
    );
  }

  return assessment;
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

  let categoryCode = 'D';
  if (assessment.alcoholic_status === 'Alcoholic') {
    categoryCode = 'D';
  } else {
    const pct = Number(assessment.percentage || 0);
    if (pct >= 80) {
      categoryCode = 'A';
    } else if (pct >= 70) {
      categoryCode = 'B';
    } else if (pct >= 60) {
      categoryCode = 'C';
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