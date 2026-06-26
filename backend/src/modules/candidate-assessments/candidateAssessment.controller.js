const service = require("./candidateAssessment.service");

async function getMyAssessmentsHistoryController(req, res) {
  try {
    const history = await service.getMyAssessmentsHistoryService(req.user.userId);
    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getActiveAssessmentController(req, res) {
  try {
    const active = await service.getActiveAssessmentService(req.user.userId);
    return res.status(200).json({
      success: true,
      data: active,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAssessmentResultController(req, res) {
  try {
    const { id } = req.params;
    const result = await service.getAssessmentResultService(id, req.user.userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMcqQuestionsForExamController(req, res) {
  try {
    const { id } = req.params;
    const questions = await service.getMcqQuestionsForExamService(id, req.user.userId);
    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
}

async function startMcqExamController(req, res) {
  try {
    const { id } = req.params;
    const result = await service.startMcqExamService(id, req.user.userId);
    return res.status(200).json({
      success: true,
      message: "MCQ Exam started.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function saveCandidateAnswerController(req, res) {
  try {
    const { id } = req.params;
    const { questionId, selectedAnswer } = req.body;

    if (!questionId || !selectedAnswer) {
      return res.status(400).json({
        success: false,
        message: "questionId and selectedAnswer are required",
      });
    }

    const answer = await service.saveCandidateAnswerService(
      id,
      req.user.userId,
      questionId,
      selectedAnswer
    );

    return res.status(200).json({
      success: true,
      message: "Answer saved.",
      data: answer,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function toggleMarkForReviewController(req, res) {
  try {
    const { id } = req.params;
    const { questionId, isMarkedForReview } = req.body;

    if (!questionId || isMarkedForReview === undefined) {
      return res.status(400).json({
        success: false,
        message: "questionId and isMarkedForReview are required",
      });
    }

    const result = await service.toggleMarkForReviewService(
      id,
      req.user.userId,
      questionId,
      isMarkedForReview
    );

    return res.status(200).json({
      success: true,
      message: "Question review status updated.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function submitMcqExamController(req, res) {
  try {
    const { id } = req.params;
    const result = await service.submitMcqExamService(id, req.user.userId);
    return res.status(200).json({
      success: true,
      message: "MCQ Exam submitted successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getMyAssessmentsHistoryController,
  getActiveAssessmentController,
  getAssessmentResultController,
  getMcqQuestionsForExamController,
  startMcqExamController,
  saveCandidateAnswerController,
  toggleMarkForReviewController,
  submitMcqExamController,
};
