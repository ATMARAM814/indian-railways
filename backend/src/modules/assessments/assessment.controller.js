const {
  createAssessment,
  listAssessmentQuestions,
  submitMcqAnswers,
  submitEvaluation,
  fetchAssessmentResult,
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
  getEmployeeAssessmentHistoryService,
  createBulkAssessmentsService,
  cancelAssessment,
  getPmeRefStatusService,
  getBulkEligibleStaffService,
} = require("./assessment.service");

async function createAssessmentController(req, res) {
  try {
    const {
      assessedUserId,
      assessedRoleCode,
      assessmentCycle,
      assessmentType,
      scheduledDate,
      dueDate,
      instructionsRemarks,
    } = req.body;

    const assessment = await createAssessment({
      assessedUserId,
      assessedRoleCode,
      assessorUserId: req.user.userId,
      assessorRoleCode: req.user.role,
      assessmentCycle,
      assessmentType,
      scheduledDate,
      dueDate,
      instructionsRemarks,
    });

    return res.status(201).json({
      success: true,
      message: "Assessment scheduled and activated successfully",
      data: assessment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAssessmentQuestionsController(req, res) {
  try {
    const { assessmentId } = req.params;

    const questions =
      await listAssessmentQuestions(assessmentId, req.user.userId, req.user.role);

    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function submitMcqAnswersController(req, res) {
  try {
    const { assessmentId } = req.params;
    const { answers } = req.body;

    const assessment =
      await submitMcqAnswers(
        assessmentId,
        req.user.userId,
        answers
    );

    return res.status(200).json({
      success: true,
      message: "MCQ answers submitted successfully",
      data: assessment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function submitEvaluationController(req, res) {
  try {
    const { assessmentId } = req.params;

    const { answers, operationalDetails } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "answers must be an array",
        receivedBody: req.body,
      });
    }

    const assessment = await submitEvaluation(
        assessmentId,
        req.user.userId,
        answers,
        operationalDetails
    );

    return res.status(200).json({
      success: true,
      message: "Evaluation submitted successfully",
      data: assessment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAssessmentResultController(req, res) {
  try {
    const { assessmentId } = req.params;

    const result =
      await fetchAssessmentResult(assessmentId, req.user.userId, req.user.role);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMyCreatedAssessmentsController(req, res) {
  try {
    const assessments =
      await listCreatedAssessments(req.user.userId);

    return res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMyPendingAssessmentsController(req, res) {
  try {
    const assessments =
      await listPendingAssessments(req.user.userId);

    return res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getPendingEvaluationsController(req, res) {
  try {
    const assessments =
      await listPendingEvaluations(req.user.userId);

    return res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getMyResultsController(req, res) {
  try {
    const results =
      await listMyResults(req.user.userId);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function saveEvaluationDraftController(req, res) {
  try {
    const { assessmentId } = req.params;
    const { answers, operationalDetails } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "answers must be an array",
      });
    }

    const assessment =
      await saveEvaluationDraftService(
        assessmentId,
        req.user.userId,
        answers,
        operationalDetails
      );

    return res.status(200).json({
      success: true,
      message: "Evaluation draft saved successfully",
      data: assessment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getEvaluationDraftController(req, res) {
  try {
    const { assessmentId } = req.params;

    const draft =
      await getEvaluationDraftService(
        assessmentId,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      data: draft,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getEligibleStaffController(req, res) {
  try {
    const { roleCode } = req.params;
    const filters = {
      search: req.query.search,
      stationId: req.query.stationId,
      status: req.query.status,
      category: req.query.category,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await getEligibleStaffService(
      req.user.userId,
      req.user.role,
      roleCode,
      filters
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      total: result.total,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAssessorRoleStatsController(req, res) {
  try {
    const stats = await getAssessorRoleStatsService(
      req.user.userId,
      req.user.role
    );

    const { roleCode } = req.params;
    if (roleCode) {
      const roleStats = stats.find(s => s.roleCode === roleCode);
      return res.status(200).json({
        success: true,
        data: roleStats || null,
      });
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getYesNoQuestionsController(req, res) {
  try {
    const { roleCode } = req.params;
    const questions = await getYesNoQuestionsWithSections(roleCode);
    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getAssessmentAnswersController(req, res) {
  try {
    const { assessmentId } = req.params;
    const answers = await getAssessmentAnswersService(assessmentId, req.user.userId, req.user.role);
    return res.status(200).json({
      success: true,
      data: answers,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function cancelAssessmentController(req, res) {
  try {
    const { assessmentId } = req.params;
    const { reason } = req.body;

    const result = await cancelAssessment(assessmentId, reason, req.user.userId, req.user.role);
    return res.status(200).json({
      success: true,
      message: "Assessment has been cancelled successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getEmployeeAssessmentHistoryController(req, res) {
  try {
    const { employeeId } = req.params;
    const result = await getEmployeeAssessmentHistoryService(employeeId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function deactivateAssessmentController(req, res) {
  try {
    const { assessmentId } = req.params;
    const result = await deactivateAssessment(assessmentId, req.user.userId, req.user.role);
    return res.status(200).json({
      success: true,
      message: "MCQ Exam session has been deactivated successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getBulkEligibleStaffController(req, res) {
  try {
    const { roleCode } = req.params;
    const result = await getBulkEligibleStaffService(req.user.userId, req.user.role, roleCode);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function createBulkAssessmentsController(req, res) {
  try {
    const {
      roleCode,
      assessmentCycle,
      assessmentType,
      scheduledDate,
      dueDate,
      instructionsRemarks,
    } = req.body;

    const result = await createBulkAssessmentsService({
      assessorUserId: req.user.userId,
      assessorRoleCode: req.user.role,
      assessedRoleCode: roleCode,
      assessmentCycle,
      assessmentType,
      scheduledDate,
      dueDate,
      instructionsRemarks,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully scheduled assessments for ${result.count} employees.`,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function getPmeRefStatusController(req, res) {
  try {
    const userId = req.user.userId;
    const data = await getPmeRefStatusService(userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createAssessmentController,
  getAssessmentQuestionsController,
  submitMcqAnswersController,
  submitEvaluationController,
  getAssessmentResultController,
  getMyCreatedAssessmentsController,
  getMyPendingAssessmentsController,
  getPendingEvaluationsController,
  getMyResultsController,
  saveEvaluationDraftController,
  getEvaluationDraftController,
  getEligibleStaffController,
  getAssessorRoleStatsController,
  getYesNoQuestionsController,
  getAssessmentAnswersController,
  deactivateAssessmentController,
  cancelAssessmentController,
  getEmployeeAssessmentHistoryController,
  getBulkEligibleStaffController,
  createBulkAssessmentsController,
  getPmeRefStatusController,
};