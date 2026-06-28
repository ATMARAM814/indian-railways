const db = require("./counseling.repository");

async function getCandidateCounselingData(profileId) {
  const candidate = await db.getCandidateDetailsDb(profileId);
  if (!candidate) {
    throw new Error("Candidate profile not found or has no active station posting.");
  }

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
      isCompleted: statusRecord.isCompleted ?? false,
      remarks: statusRecord.remarks || "",
      markedByName: statusRecord.markedByName || null,
      markedAt: statusRecord.markedAt || null
    };
  });

  return {
    candidate,
    subjects: subjectsWithStatus
  };
}

async function saveCandidateCounselingData({ profileId, statusList, markedBy }) {
  if (!profileId) {
    throw new Error("Missing candidate profileId.");
  }
  if (!Array.isArray(statusList)) {
    throw new Error("statusList must be an array of status updates.");
  }

  for (const item of statusList) {
    const { subjectId, isCompleted, remarks } = item;
    if (!subjectId) {
      throw new Error("Each status update must contain a subjectId.");
    }
    await db.upsertCounselingStatusDb({
      profileId,
      subjectId,
      isCompleted: !!isCompleted,
      markedBy,
      remarks: remarks || ""
    });
  }

  return { success: true };
}

module.exports = {
  getCandidateCounselingData,
  saveCandidateCounselingData
};
