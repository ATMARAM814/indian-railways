const repo = require("./candidateAssessment.repository");
const { logAction } = require("../audit/audit.service");

async function verifyAssessmentOwnership(assessmentId, userId, allowedStatuses = []) {
  const assessment = await repo.getAssessmentDetailsForCandidate(assessmentId, userId);
  if (!assessment) {
    throw new Error("Assessment not found or you are not authorized to access it");
  }

  if (allowedStatuses.length > 0 && !allowedStatuses.includes(assessment.status)) {
    throw new Error(`This operation is not permitted. Current assessment status: ${assessment.status}`);
  }

  return assessment;
}

async function getMyAssessmentsHistoryService(userId) {
  return await repo.getMyAssessmentsHistory(userId);
}

async function getActiveAssessmentService(userId) {
  return await repo.getActiveAssessment(userId);
}

async function getAssessmentResultService(assessmentId, userId) {
  const assessment = await verifyAssessmentOwnership(assessmentId, userId);
  
  // If completed, approved, or rejected, return the detailed analysis report review
  const questionsReview = await repo.getScorecardQuestionsReview(assessmentId);
  return {
    assessment,
    questionsReview,
  };
}

async function getMcqQuestionsForExamService(assessmentId, userId) {
  await verifyAssessmentOwnership(assessmentId, userId, ["created", "mcq_access_sent", "mcq_pending"]);
  return await repo.getMcqQuestionsForExam(assessmentId);
}

async function startMcqExamService(assessmentId, userId) {
  const assessment = await verifyAssessmentOwnership(assessmentId, userId, ["created", "mcq_access_sent", "mcq_pending"]);

  await logAction(
    userId,
    "MCQ_EXAM_STARTED",
    "ASSESSMENT",
    assessmentId,
    null,
    null,
    `MCQ exam attempt started by candidate ${userId}`
  );
  return { success: true };
}

async function saveCandidateAnswerService(assessmentId, userId, questionId, selectedAnswer) {
  await verifyAssessmentOwnership(assessmentId, userId, ["created", "mcq_access_sent", "mcq_pending"]);

  const correctAnswer = await repo.getCorrectAnswer(questionId);
  if (!correctAnswer) {
    throw new Error("Question not found in the question bank");
  }

  const isCorrect = correctAnswer === selectedAnswer;
  return await repo.saveCandidateAnswer(assessmentId, questionId, selectedAnswer, isCorrect);
}

async function toggleMarkForReviewService(assessmentId, userId, questionId, isMarkedForReview) {
  await verifyAssessmentOwnership(assessmentId, userId, ["created", "mcq_access_sent", "mcq_pending"]);
  return await repo.toggleMarkForReview(assessmentId, questionId, isMarkedForReview);
}

async function submitMcqExamService(assessmentId, userId) {
  const assessment = await verifyAssessmentOwnership(assessmentId, userId, ["created", "mcq_access_sent", "mcq_pending"]);

  // 2. Fetch all answers to calculate score
  const dbAnswers = await repo.getMcqQuestionsForExam(assessmentId);
  let mcqScore = 0;
  for (const q of dbAnswers) {
    // Get is_correct from DB or resolve it
    const correctAnswer = await repo.getCorrectAnswer(q.question_id);
    if (correctAnswer === q.selected_answer) {
      mcqScore++;
    }
  }

  // 3. Submit in repository
  const updatedAssessment = await repo.submitMcqExam(assessmentId, mcqScore);

  // 4. Log audit action
  await logAction(
    userId,
    "MCQ_EXAM_SUBMITTED",
    "ASSESSMENT",
    assessmentId,
    null,
    updatedAssessment,
    `MCQ exam successfully submitted by candidate. MCQ Score: ${mcqScore}`
  );

  return updatedAssessment;
}

module.exports = {
  getMyAssessmentsHistoryService,
  getActiveAssessmentService,
  getAssessmentResultService,
  getMcqQuestionsForExamService,
  startMcqExamService,
  saveCandidateAnswerService,
  toggleMarkForReviewService,
  submitMcqExamService,
};
