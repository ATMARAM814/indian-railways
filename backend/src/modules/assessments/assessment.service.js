const { logAction } = require("../audit/audit.service");
const {
  countActiveQuestions,
  createAssessmentRecord,
  getRandomQuestions,
  saveAssessmentQuestions,
  getAssessmentQuestions,
  getQuestionsWithCorrectAnswers,
  saveMcqAnswers,
  updateMcqScore,
  getYesNoQuestionsWithSections,
  saveYesNoAnswers,
  updateEvaluationScore,
  getAssessmentById,
  getAssessmentResult,
  getAssessmentsCreatedByUser,
  getPendingAssessmentsForUser,
  getPendingEvaluationsForAssessor,
  getAssessmentResultsForUser,
  saveEvaluationDraftAnswers,
  getEvaluationDraftAnswers,
  getEligibleStaff,
  getAssessorRoleStats,
  updateAssessmentOperationalDetails,
  getYesNoAnswersForAssessment,
  deleteAssessmentRecord,
  cancelAssessmentRecord,
  hasActiveAssessment,
  getEmployeeAssessmentHistory,
  getBulkEligibleStaff,
  getPmeRefStatusRepository,
  hasStationSupervisor,
} = require("./assessment.repository");

async function createAssessment({
  assessedUserId,
  assessorUserId,
  assessedRoleCode,
  assessorRoleCode,
  assessmentCycle,
  assessmentType,
  scheduledDate,
  dueDate,
  instructionsRemarks,
}) {

  const pool = require("../../config/database");
  const checkReportingRes = await pool.query(
    `SELECT p.reporting_officer_id, r.name as reporting_officer_role
     FROM profiles p
     LEFT JOIN profiles ro ON ro.id = p.reporting_officer_id
     LEFT JOIN roles r ON r.id = ro.role_id
     WHERE p.id = $1`,
    [assessedUserId]
  );
  const reportingOfficerId = checkReportingRes.rows[0]?.reporting_officer_id;
  const reportingOfficerRole = checkReportingRes.rows[0]?.reporting_officer_role;

  let finalAssessorUserId = assessorUserId;
  let finalAssessorRoleCode = assessorRoleCode;

  if (reportingOfficerId && (assessmentType === 'Retest' || ['TI', 'AOM', 'SUPER_ADMIN'].includes(assessorRoleCode))) {
    finalAssessorUserId = reportingOfficerId;
    finalAssessorRoleCode = reportingOfficerRole || 'SM';
  }

  if (reportingOfficerId !== finalAssessorUserId && assessmentType !== 'Retest' && assessmentCycle !== 'Retest after Counseling') {
    validateAssessmentHierarchy(
      finalAssessorRoleCode,
      assessedRoleCode,
      finalAssessorUserId
    );
  }

  if (assessmentType !== 'Retest' && assessmentCycle !== 'Retest after Counseling' && finalAssessorRoleCode === "TI" && assessedRoleCode !== "TM") {
    const hasSms = await hasStationSupervisor(assessedUserId);
    if (hasSms) {
      throw new Error(
        "This station has an assigned Station Master Supervisor. TI cannot assess staff of this station."
      );
    }
  }

  const activeExists = await hasActiveAssessment(assessedUserId);
  if (activeExists) {
    throw new Error("This employee already has an active assessment cycle.");
  }

  const totalQuestions =
    await countActiveQuestions(assessedRoleCode);

  if (totalQuestions === 0) {
    throw new Error(`No questions are present for this role`);
  } else if (totalQuestions < 25) {
    throw new Error(
      `Not enough active questions available for ${assessedRoleCode} assessment`
    );
  }

  const assessment = await createAssessmentRecord({
    assessedUserId,
    assessorUserId: finalAssessorUserId,
    assessedRoleCode,
    assessorRoleCode: finalAssessorRoleCode,
    assessmentCycle,
    assessmentType,
    scheduledDate,
    dueDate,
    instructionsRemarks,
  });

  const questions = await getRandomQuestions(
    assessedRoleCode,
    25
  );

  await saveAssessmentQuestions(
    assessment.id,
    questions
  );

  await logAction(
    assessorUserId,
    "ASSESSMENT_CREATED",
    "ASSESSMENT",
    assessment.id,
    null,
    assessment,
    `Assessment scheduled and activated for user ${assessedUserId}`
  );

  return assessment;
}

async function listAssessmentQuestions(assessmentId, userId, userRole) {
  await verifyAssessmentAccess(assessmentId, userId, userRole);

  return await getAssessmentQuestions(assessmentId);
}

function validateAssessmentHierarchy(
  assessorRoleCode,
  assessedRoleCode,
  assessorId
) {
  if (assessorRoleCode === "SUPER_ADMIN") {
    return;
  }

  const allowedMap = {
    SM: ["PM", "Shunting Master", "SHUNTING MASTER", "SHM"],
    SS: ["PM", "Shunting Master", "SHUNTING MASTER", "SHM"],
    "Cabin Master": ["PM", "Shunting Master", "SHUNTING MASTER", "SHM"],
    "CABIN MASTER": ["PM", "Shunting Master", "SHUNTING MASTER", "SHM"],
    TI: ["SM", "SS", "TM", "Cabin Master", "CABIN MASTER"],
    "Station Master Supervisor": ["SM", "SS", "Cabin Master", "CABIN MASTER"],
    SMS: ["SM", "SS", "Cabin Master", "CABIN MASTER"],
    "STATION MASTER SUPERVISOR": ["SM", "SS", "Cabin Master", "CABIN MASTER"],
    AOM: ["TI", "Station Master Supervisor", "SMS", "STATION MASTER SUPERVISOR"],
  };

  // Exception for Anant Kakirwar
  if (assessorId === '439a8db6-2546-4858-abbc-3752f4acb536' && ['SM', 'SS', 'Cabin Master', 'CABIN MASTER'].includes(assessorRoleCode)) {
    allowedMap[assessorRoleCode] = ["PM", "Shunting Master", "SHUNTING MASTER", "SHM", "TM", "Train Manager"];
  }

  const allowedRoles =
    allowedMap[assessorRoleCode] || [];

  if (!allowedRoles.includes(assessedRoleCode)) {
    throw new Error(
      `${assessorRoleCode} cannot create assessment for ${assessedRoleCode}`
    );
  }
}

async function submitMcqAnswers(assessmentId, userId, submittedAnswers){
  const correctAnswers =
    await getQuestionsWithCorrectAnswers(assessmentId);

    const assessment = await getAssessmentById(assessmentId);
    if (assessment.assessed_user_id !== userId) {
      throw new Error("Only assessed employee can submit MCQ exam");
    }
    if (!assessment) {
      throw new Error("Assessment not found");
    }

if (assessment.status !== "created") {
  throw new Error("MCQ exam already submitted or assessment is not open");
}

  if (submittedAnswers.length !== correctAnswers.length) {
    throw new Error(
      `All ${correctAnswers.length} questions must be answered before submission`
    );
  }

  const correctAnswerMap = new Map();

  correctAnswers.forEach((q) => {
    correctAnswerMap.set(
      q.question_id,
      q.correct_answer
    );
  });

  let mcqScore = 0;

  const answersToSave = submittedAnswers.map((answer) => {
    const correctAnswer =
      correctAnswerMap.get(answer.questionId);

    const isCorrect =
      correctAnswer === answer.selectedAnswer;

    if (isCorrect) {
      mcqScore++;
    }

    return {
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      isCorrect,
    };
  });

  await saveMcqAnswers(
    assessmentId,
    answersToSave
  );

  const updatedAssessment =
    await updateMcqScore(assessmentId, mcqScore);

  return updatedAssessment;
}

async function submitEvaluation(assessmentId, userId, submittedAnswers, operationalDetails) {

const assessment = await getAssessmentById(assessmentId);

if (!assessment) {
  throw new Error("Assessment not found");
}

  const pool = require("../../config/database");
  const checkAuthRes = await pool.query(
    `SELECT 
       (
         r_user.name IN ('SM', 'Station Master', 'STATION MASTER', 'Cabin Master', 'CABIN MASTER', 'SS', 'Station Master Incharge', 'STATION MASTER INCHARGE', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR')
         AND EXISTS (
           SELECT 1 
           FROM staff_station_postings ssp1
           JOIN staff_station_postings ssp2 ON ssp1.station_id = ssp2.station_id
           WHERE ssp1.profile_id = $1 
             AND ssp2.profile_id = $2 
             AND ssp1.is_current = true 
             AND ssp2.is_current = true
         )
       ) as "isStationAuthority"
     FROM profiles p_user
     JOIN roles r_user ON r_user.id = p_user.role_id
     WHERE p_user.id = $2`,
    [assessment.assessed_user_id, userId]
  );
  
  const isAssessor = assessment.assessor_user_id === userId;
  const isStationAuthority = checkAuthRes.rows[0]?.isStationAuthority || false;

  if (!isAssessor && !isStationAuthority) {
    throw new Error("Only assessor or station master can submit evaluation");
  }

const isMcqSubmitted = assessment.status === "mcq_submitted";
const isUnapprovedCompleted = assessment.status === "completed" && ["pending_approval", "rejected"].includes(assessment.approval_status);

if (!isMcqSubmitted && !isUnapprovedCompleted) {
  throw new Error(
    "Evaluation already approved and locked, or MCQ exam is not completed"
  );
}

const roleCode = assessment.assessed_role_code;

  const questions =
    await getYesNoQuestionsWithSections(roleCode);

  if (submittedAnswers.length !== questions.length) {
    throw new Error(
      `All ${questions.length} Yes/No questions must be answered`
    );
  }

  const questionMap = new Map();

  questions.forEach((q) => {
    questionMap.set(q.question_id, q);
  });

  const sectionScores = {
    ALERTNESS: 0,
    SAFETY_RECORD: 0,
    LEADERSHIP: 0,
    DISCIPLINE: 0,
    APPEARANCE: 0,
  };

  const answersToSave = submittedAnswers.map((answer) => {
    const question = questionMap.get(answer.questionId);

    if (!question) {
      throw new Error("Invalid Yes/No question submitted");
    }

    const marksAwarded = answer.answer
      ? question.marks_per_question
      : 0;

    sectionScores[question.section_code] += marksAwarded;

    return {
      questionId: answer.questionId,
      sectionCode: question.section_code,
      answer: answer.answer,
      marksAwarded,
    };
  });

  await saveYesNoAnswers(assessmentId, answersToSave);

  if (operationalDetails) {
    await updateAssessmentOperationalDetails(assessmentId, operationalDetails);
  }

  const completedAssessment = await updateEvaluationScore(
    assessmentId,
    sectionScores
  );

  await logAction(
    userId,
    "ASSESSMENT_COMPLETED",
    "ASSESSMENT",
    assessmentId,
    null,
    completedAssessment,
    `Evaluation completed for assessment ${assessmentId}`
  );

  return completedAssessment;
}

async function fetchAssessmentResult(assessmentId, userId, userRole) {
  await verifyAssessmentAccess(assessmentId, userId, userRole);

  const result = await getAssessmentResult(assessmentId);

  if (!result) {
    throw new Error("Assessment result not found");
  }

  return result;
}

async function verifyAssessmentAccess(assessmentId, userId, userRole) {
  const assessment = await getAssessmentById(assessmentId);

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  if (userRole === "SUPER_ADMIN") {
    return assessment;
  }

  const pool = require("../../config/database");
  const checkReportingRes = await pool.query(
    "SELECT reporting_officer_id FROM profiles WHERE id = $1",
    [assessment.assessed_user_id]
  );
  const reportingOfficerId = checkReportingRes.rows[0]?.reporting_officer_id;

  const isAssessor =
    assessment.assessor_user_id === userId;

  const isAssessedUser =
    assessment.assessed_user_id === userId;

  const assessedRole = assessment.assessed_role_code;
  let isApprover =
    (userRole === "TI" && ["PM", "Shunting Master", "SHUNTING MASTER", "SHM"].includes(assessedRole)) ||
    (["SMS", "Station Master Supervisor", "STATION MASTER SUPERVISOR"].includes(userRole) && ["PM", "Shunting Master", "SHUNTING MASTER", "SHM"].includes(assessedRole)) ||
    (userRole === "AOM" && ["SM", "TM", "TI", "SS", "Station Master Supervisor", "STATION MASTER SUPERVISOR", "SMS", "Cabin Master", "CABIN MASTER"].includes(assessedRole));

  if (reportingOfficerId === userId) {
    isApprover = true;
  }

  let isStationAuthority = false;
  const targetRoles = [
    "SM", "Station Master", "STATION MASTER",
    "Cabin Master", "CABIN MASTER",
    "SS", "Station Master Incharge", "STATION MASTER INCHARGE",
    "SMS", "Station Master Supervisor", "STATION MASTER SUPERVISOR"
  ];
  if (targetRoles.includes(userRole)) {
    const checkStationRes = await pool.query(
      `SELECT EXISTS (
        SELECT 1 
        FROM staff_station_postings ssp1
        JOIN staff_station_postings ssp2 ON ssp1.station_id = ssp2.station_id
        WHERE ssp1.profile_id = $1 
          AND ssp2.profile_id = $2 
          AND ssp1.is_current = true 
          AND ssp2.is_current = true
       ) as shares_station`,
      [assessment.assessed_user_id, userId]
    );
    isStationAuthority = checkStationRes.rows[0]?.shares_station || false;
  }

  if (!isAssessor && !isAssessedUser && !isApprover && !isStationAuthority) {
    throw new Error("You are not allowed to access this assessment");
  }

  return assessment;
}

async function listCreatedAssessments(userId) {
  return await getAssessmentsCreatedByUser(userId);
}

async function listPendingAssessments(userId) {
  return await getPendingAssessmentsForUser(userId);
}

async function listPendingEvaluations(userId) {
  return await getPendingEvaluationsForAssessor(userId);
}

async function listMyResults(userId) {
  return await getAssessmentResultsForUser(userId);
}

async function saveEvaluationDraftService(
  assessmentId,
  assessorId,
  answers,
  operationalDetails
) {
  const assessment =
    await getAssessmentById(
      assessmentId
    );

  if (!assessment) {
    throw new Error(
      "Assessment not found"
    );
  }

  const pool = require("../../config/database");
  const checkAuthRes = await pool.query(
    `SELECT 
       (
         r_user.name IN ('SM', 'Station Master', 'STATION MASTER', 'Cabin Master', 'CABIN MASTER', 'SS', 'Station Master Incharge', 'STATION MASTER INCHARGE', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR')
         AND EXISTS (
           SELECT 1 
           FROM staff_station_postings ssp1
           JOIN staff_station_postings ssp2 ON ssp1.station_id = ssp2.station_id
           WHERE ssp1.profile_id = $1 
             AND ssp2.profile_id = $2 
             AND ssp1.is_current = true 
             AND ssp2.is_current = true
         )
       ) as "isStationAuthority"
     FROM profiles p_user
     JOIN roles r_user ON r_user.id = p_user.role_id
     WHERE p_user.id = $2`,
    [assessment.assessed_user_id, assessorId]
  );
  
  const isAssessor = assessment.assessor_user_id === assessorId;
  const isStationAuthority = checkAuthRes.rows[0]?.isStationAuthority || false;

  if (!isAssessor && !isStationAuthority) {
    throw new Error("Only assessor or station master can save draft");
  }

  if (operationalDetails) {
    await updateAssessmentOperationalDetails(assessmentId, operationalDetails);
  }

  return await saveEvaluationDraftAnswers(
    assessmentId,
    answers
  );
}

async function getEvaluationDraftService(
  assessmentId,
  userId
) {
  const assessment =
    await getAssessmentById(assessmentId);

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  const pool = require("../../config/database");
  const checkAuthRes = await pool.query(
    `SELECT 
       (
         r_user.name IN ('SM', 'Station Master', 'STATION MASTER', 'Cabin Master', 'CABIN MASTER', 'SS', 'Station Master Incharge', 'STATION MASTER INCHARGE', 'SMS', 'Station Master Supervisor', 'STATION MASTER SUPERVISOR')
         AND EXISTS (
           SELECT 1 
           FROM staff_station_postings ssp1
           JOIN staff_station_postings ssp2 ON ssp1.station_id = ssp2.station_id
           WHERE ssp1.profile_id = $1 
             AND ssp2.profile_id = $2 
             AND ssp1.is_current = true 
             AND ssp2.is_current = true
         )
       ) as "isStationAuthority"
     FROM profiles p_user
     JOIN roles r_user ON r_user.id = p_user.role_id
     WHERE p_user.id = $2`,
    [assessment.assessed_user_id, userId]
  );
  
  const isAssessor = assessment.assessor_user_id === userId;
  const isStationAuthority = checkAuthRes.rows[0]?.isStationAuthority || false;

  if (!isAssessor && !isStationAuthority) {
    throw new Error("Only assessor or station master can view evaluation draft");
  }

  return await getEvaluationDraftAnswers(
    assessmentId
  );
}

async function getEligibleStaffService(assessorId, assessorRole, roleCode, filters) {
  validateAssessmentHierarchy(assessorRole, roleCode, assessorId);
  return await getEligibleStaff(assessorId, assessorRole, roleCode, filters);
}

async function getAssessorRoleStatsService(assessorId, assessorRole) {
  return await getAssessorRoleStats(assessorId, assessorRole);
}

async function getAssessmentAnswersService(assessmentId, userId, userRole) {
  await verifyAssessmentAccess(assessmentId, userId, userRole);
  return await getYesNoAnswersForAssessment(assessmentId);
}

async function deactivateAssessment(assessmentId, userId, userRole) {
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  if (assessment.assessor_user_id !== userId && userRole !== "SUPER_ADMIN") {
    throw new Error("Only the assessor who activated the MCQ can deactivate it");
  }

  if (assessment.status !== "created") {
    throw new Error("MCQ exam has already been attempted/submitted and cannot be deactivated");
  }

  await deleteAssessmentRecord(assessmentId);

  // Log audit action
  await logAction(
    userId,
    "ASSESSMENT_DEACTIVATED",
    "ASSESSMENT",
    assessmentId,
    null,
    assessment,
    `MCQ Exam deactivated for user ${assessment.assessed_user_id}`
  );

  return { success: true };
}

async function cancelAssessment(assessmentId, reason, userId, userRole) {
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  if (assessment.assessor_user_id !== userId && userRole !== "SUPER_ADMIN") {
    throw new Error("Only the assigned assessor or super admin can cancel this assessment");
  }

  const disallowedStatuses = ['mcq_submitted', 'evaluated', 'completed', 'pending_approval', 'approved', 'evaluation_submitted'];
  if (disallowedStatuses.includes(assessment.status)) {
    throw new Error("Cannot cancel assessment after candidate has attempted the MCQ exam");
  }

  const activeStatuses = ['scheduled', 'mcq_access_sent', 'mcq_pending', 'created'];
  if (!activeStatuses.includes(assessment.status)) {
    throw new Error(`Cannot cancel assessment with status: ${assessment.status}`);
  }

  const cancelledAssessment = await cancelAssessmentRecord(assessmentId, reason);

  await logAction(
    userId,
    "ASSESSMENT_CANCELLED",
    "ASSESSMENT",
    assessmentId,
    null,
    cancelledAssessment,
    `Assessment cancelled by user ${userId}. Reason: ${reason}`
  );

  return cancelledAssessment;
}

async function getEmployeeAssessmentHistoryService(employeeId) {
  return await getEmployeeAssessmentHistory(employeeId);
}

async function getBulkEligibleStaffService(assessorId, assessorRole, roleCode) {
  validateAssessmentHierarchy(assessorRole, roleCode, assessorId);
  return await getBulkEligibleStaff(assessorId, assessorRole, roleCode);
}

async function createBulkAssessmentsService({
  assessorUserId,
  assessorRoleCode,
  assessedRoleCode,
  assessmentCycle,
  assessmentType,
  scheduledDate,
  dueDate,
  instructionsRemarks,
}) {
  validateAssessmentHierarchy(assessorRoleCode, assessedRoleCode, assessorUserId);

  const totalQuestions = await countActiveQuestions(assessedRoleCode);
  if (totalQuestions === 0) {
    throw new Error(`No questions are present for this role`);
  } else if (totalQuestions < 25) {
    throw new Error(
      `Not enough active questions available for ${assessedRoleCode} assessment`
    );
  }

  const staff = await getBulkEligibleStaff(assessorUserId, assessorRoleCode, assessedRoleCode);
  if (staff.length === 0) {
    throw new Error("No eligible employees found for bulk scheduling.");
  }

  const createdAssessments = [];
  for (const emp of staff) {
    const assessment = await createAssessmentRecord({
      assessedUserId: emp.id,
      assessorUserId,
      assessedRoleCode,
      assessorRoleCode,
      assessmentCycle,
      assessmentType,
      scheduledDate,
      dueDate,
      instructionsRemarks,
    });

    const questions = await getRandomQuestions(assessedRoleCode, 25);
    await saveAssessmentQuestions(assessment.id, questions);

    await logAction(
      assessorUserId,
      "ASSESSMENT_CREATED",
      "ASSESSMENT",
      assessment.id,
      null,
      assessment,
      `Assessment scheduled and activated for user ${emp.id} (Bulk)`
    );

    createdAssessments.push({
      id: assessment.id,
      employeeId: emp.id,
      fullName: emp.full_name,
    });
  }

  return {
    count: createdAssessments.length,
    assessments: createdAssessments,
  };
}

async function getPmeRefStatusService(userId) {
  const { records, profile } = await getPmeRefStatusRepository(userId);

  // PME filtering and computation
  const pmeHistory = [];
  let pmeLastDate = profile.pme_done || null;
  let pmeNextDueDate = profile.pme_due || null;
  let pmeCurrentStatus = null;
  let pmeTotalCompleted = 0;
  let pmePendingScheduled = 0;
  let pmeExpiredOverdue = 0;

  // REF filtering and computation
  const refHistory = [];
  let refLastDate = profile.ref_done || null;
  let refNextDueDate = profile.ref_due || null;
  let refCurrentStatus = null;
  let refTotalCompleted = 0;
  let refPendingScheduled = 0;
  let refExpiredCancelled = 0;

  const now = new Date();

  records.forEach((row) => {
    const isPmeRow = row.pme_status && row.pme_status.trim() !== '';
    const isRefRow = row.ref_status && row.ref_status.trim() !== '';

    // Process PME history
    if (isPmeRow) {
      pmeHistory.push({
        id: row.id,
        pmeDate: row.evaluated_at || row.created_at,
        pmeStatus: row.pme_status,
        conductedBy: row.assessor_name || '—',
        nextDueDate: row.due_date || '—',
        medicalFitnessStatus: row.pme_status,
        remarks: row.remarks || '—',
      });
      
      if (row.status === 'completed' && row.approval_status === 'approved') {
        pmeTotalCompleted++;
        if (!pmeCurrentStatus) {
          pmeCurrentStatus = row.pme_status;
        }
        if (!pmeLastDate) {
          pmeLastDate = row.evaluated_at || row.created_at;
          pmeNextDueDate = row.due_date;
        }
      }
    }

    // Process REF history
    if (isRefRow) {
      refHistory.push({
        id: row.id,
        trainingDate: row.evaluated_at || row.created_at,
        refStatus: row.ref_status,
        conductedBy: row.assessor_name || '—',
        nextDueDate: row.due_date || '—',
        remarks: row.remarks || '—',
      });
      
      if (row.status === 'completed' && row.approval_status === 'approved') {
        refTotalCompleted++;
        if (!refCurrentStatus) {
          refCurrentStatus = row.ref_status;
        }
        if (!refLastDate) {
          refLastDate = row.evaluated_at || row.created_at;
          refNextDueDate = row.due_date;
        }
      }
    }

    // Pending / Scheduled and Expired checks
    if (row.status !== 'completed' && row.status !== 'cancelled') {
      const isOverdue = row.due_date && new Date(row.due_date) < now;
      
      if (isPmeRow) {
        if (isOverdue) pmeExpiredOverdue++;
        else pmePendingScheduled++;
      }
      
      if (isRefRow) {
        if (isOverdue) refExpiredCancelled++;
        else refPendingScheduled++;
      }
    }

    if (row.status === 'cancelled') {
      if (isRefRow) {
        refExpiredCancelled++;
      }
    }
  });

  return {
    pme: {
      lastDate: pmeLastDate,
      nextDueDate: pmeNextDueDate,
      currentStatus: pmeCurrentStatus || '—',
      totalCompleted: pmeTotalCompleted,
      pendingScheduled: pmePendingScheduled,
      expiredOverdue: pmeExpiredOverdue,
      history: pmeHistory,
    },
    ref: {
      lastDate: refLastDate,
      nextDueDate: refNextDueDate,
      currentStatus: refCurrentStatus || '—',
      totalCompleted: refTotalCompleted,
      pendingScheduled: refPendingScheduled,
      expiredCancelled: refExpiredCancelled,
      history: refHistory,
    }
  };
}

module.exports = {
  createAssessment,
  listAssessmentQuestions,
  submitMcqAnswers,
  submitEvaluation,
  fetchAssessmentResult,
  verifyAssessmentAccess,
  listCreatedAssessments,
  listPendingAssessments,
  listPendingEvaluations,
  listMyResults,
  saveEvaluationDraftService,
  getEvaluationDraftService,
  getEligibleStaffService,
  getAssessorRoleStatsService,
  getYesNoQuestionsWithSections,
  getAssessmentAnswersService,
  deactivateAssessment,
  cancelAssessment,
  getEmployeeAssessmentHistoryService,
  getBulkEligibleStaffService,
  createBulkAssessmentsService,
  getPmeRefStatusService,
};