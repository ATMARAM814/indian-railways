const db = require("./counseling.repository");

async function verifyAssessorAccess(candidate, assessorId, assessorRole) {
  if (!candidate) {
    throw new Error("Candidate profile not found or has no active station posting.");
  }

  const validRoles = ["TI", "AOM", "SUPER_ADMIN", "AOM Users", "AOM Users"];
  const roleUpper = (assessorRole || "").toUpperCase();
  const isAuthorizedRole = validRoles.includes(roleUpper) || 
    roleUpper.includes("AOM") || 
    roleUpper.includes("SUPER_ADMIN") || 
    roleUpper.includes("TI");

  if (!isAuthorizedRole) {
    throw new Error("Access Denied: You do not have permission to counsel candidates.");
  }

  if (roleUpper === "TI" || roleUpper.includes("TI")) {
    const tiStations = await db.getTiStations(assessorId);
    if (!tiStations.includes(candidate.stationId)) {
      throw new Error("Access Denied: Candidate station is not in your monitored section.");
    }
  } else if (roleUpper === "AOM" || roleUpper === "SUPER_ADMIN" || roleUpper.includes("AOM") || roleUpper.includes("SUPER_ADMIN")) {
    const assessorDiv = await db.getUserDivisionId(assessorId);
    if (!assessorDiv || assessorDiv !== candidate.divisionId) {
      throw new Error("Access Denied: Candidate belongs to another division.");
    }
  } else {
    throw new Error("Access Denied: Unauthorized role.");
  }
}

async function getCandidateCounselingData(profileId, assessorId, assessorRole) {
  const candidate = await db.getCandidateDetailsDb(profileId);
  await verifyAssessorAccess(candidate, assessorId, assessorRole);

  const subjects = await db.getCounselingSubjectsForRoleDb(candidate.role);
  const statuses = await db.getCandidateCounselingStatusesDb(profileId);

  // Map current completion statuses to subjects
  const statusMap = {};
  statuses.forEach((s) => {
    statusMap[s.subjectId] = s;
  });

  const subjectsWithStatus = subjects.map((sub) => {
    const statusRecord = statusMap[sub.id] || {};
    return {
      subjectId: sub.id,
      subjectName: sub.subjectName,
      description: sub.description,
      isCompleted: statusRecord.isCompleted ?? null,
      markedByName: statusRecord.markedByName || null,
      markedAt: statusRecord.markedAt || null
    };
  });

  return {
    candidate,
    subjects: subjectsWithStatus
  };
}

async function saveCandidateCounselingData({ profileId, statusList, markedBy, assessorRole }) {
  const candidate = await db.getCandidateDetailsDb(profileId);
  await verifyAssessorAccess(candidate, markedBy, assessorRole);

  if (!Array.isArray(statusList)) {
    throw new Error("statusList must be an array of status updates.");
  }

  for (const item of statusList) {
    const { subjectId, isCompleted } = item;
    if (!subjectId) {
      throw new Error("Each status update must contain a subjectId.");
    }
    await db.upsertCounselingStatusDb({
      profileId,
      subjectId,
      isCompleted: isCompleted === null ? null : !!isCompleted,
      markedBy
    });
  }

  return { success: true };
}

async function activateRetestService({ profileId, assessorId, assessorRole }) {
  const candidate = await db.getCandidateDetailsDb(profileId);
  await verifyAssessorAccess(candidate, assessorId, assessorRole);

  const subjects = await db.getCounselingSubjectsForRoleDb(candidate.role);
  const statuses = await db.getCandidateCounselingStatusesDb(profileId);

  const statusMap = {};
  statuses.forEach((s) => {
    statusMap[s.subjectId] = s;
  });

  const allCompleted = subjects.length > 0 && subjects.every((sub) => {
    const statusRecord = statusMap[sub.id];
    return statusRecord && statusRecord.isCompleted === true;
  });

  if (!allCompleted) {
    throw new Error("Cannot activate retest until all counseling subjects are marked as completed (Yes).");
  }

  const { createAssessment } = require("../assessments/assessment.service");
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const assessment = await createAssessment({
    assessedUserId: profileId,
    assessorUserId: assessorId,
    assessedRoleCode: candidate.role,
    assessorRoleCode: assessorRole,
    assessmentCycle: 'Retest after Counseling',
    assessmentType: 'Retest',
    scheduledDate: new Date(),
    dueDate,
    instructionsRemarks: 'Retest activated after completing counseling guidance checklist.'
  });

  // Log to counseling history and clear active statuses
  await db.insertCounselingHistoryDb({
    profileId,
    completedBy: assessorId,
    assessmentId: assessment.id
  });
  await db.clearCandidateCounselingStatusesDb(profileId);

  return { success: true, assessmentId: assessment.id };
}

async function getCounselingDirectoryCandidatesService({ assessorId, assessorRole }) {
  const validRoles = ["TI", "AOM", "SUPER_ADMIN", "AOM Users"];
  const roleUpper = (assessorRole || "").toUpperCase();
  const isAuthorizedRole = validRoles.includes(roleUpper) || 
    roleUpper.includes("AOM") || 
    roleUpper.includes("SUPER_ADMIN") || 
    roleUpper.includes("TI");

  if (!isAuthorizedRole) {
    throw new Error("Access Denied: You do not have permission to view counseling directory.");
  }

  return await db.getCounselingDirectoryCandidatesDb({ assessorId, assessorRole });
}

async function getCandidateCounselingHistoryService({ profileId, assessorId, assessorRole }) {
  const candidate = await db.getCandidateDetailsDb(profileId);
  await verifyAssessorAccess(candidate, assessorId, assessorRole);

  return await db.getCandidateCounselingHistoryDb(profileId);
}

module.exports = {
  getCandidateCounselingData,
  saveCandidateCounselingData,
  activateRetestService,
  getCounselingDirectoryCandidatesService,
  getCandidateCounselingHistoryService
};
