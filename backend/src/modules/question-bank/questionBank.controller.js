const {
  addQuestionService,
  listQuestionsService,
  getQuestionByIdService,
  updateQuestionService,
  activateQuestionService,
  deactivateQuestionService,
  importQuestionsService,
  uploadQuestionSetService,
  getUploadHistoryService,
  getQuestionBankStatsService,
  generateExcelTemplateBuffer,
  deleteQuestionService,
  exportQuestionsExcelService,
} = require("./questionBank.service");
const { getMe } = require("../auth/auth.service");

async function addQuestion(req, res) {
  try {
    const data = await addQuestionService(req.user.userId, req.body);
    return res.status(201).json({
      success: true,
      message: "Question added successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function listQuestions(req, res) {
  try {
    const data = await listQuestionsService(req.query);
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

async function getQuestionById(req, res) {
  try {
    const { id } = req.params;
    const data = await getQuestionByIdService(id);
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

async function updateQuestion(req, res) {
  try {
    const { id } = req.params;
    const data = await updateQuestionService(id, req.user.userId, req.body);
    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function activateQuestion(req, res) {
  try {
    const { id } = req.params;
    const data = await activateQuestionService(id, req.user.userId);
    return res.status(200).json({
      success: true,
      message: "Question activated successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function deactivateQuestion(req, res) {
  try {
    const { id } = req.params;
    const data = await deactivateQuestionService(id, req.user.userId);
    return res.status(200).json({
      success: true,
      message: "Question deactivated successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function importQuestions(req, res) {
  try {
    const data = await importQuestionsService(req.user.userId, req.body.questions);
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

async function uploadQuestionsController(req, res) {
  try {
    const { role_code } = req.body;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required.",
      });
    }

    const user = await getMe(req.user.userId);
    const userName = user.fullName || user.full_name || user.hrms_id || "Super Admin";

    const result = await uploadQuestionSetService(
      req.user.userId,
      userName,
      role_code,
      req.file.buffer
    );

    return res.status(200).json({
      success: true,
      role_code: result.roleCode,
      question_count: result.questionCount,
      uploaded_at: result.uploadedAt,
    });
  } catch (error) {
    if (error.validationErrors) {
      return res.status(400).json({
        success: false,
        message: "Validation failed for the uploaded Excel file.",
        errors: error.validationErrors,
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function uploadHistoryController(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const result = await getUploadHistoryService(page, limit);
    return res.status(200).json({
      success: true,
      data: result.records,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function statsController(req, res) {
  try {
    const result = await getQuestionBankStatsService();
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

async function downloadExcelTemplateController(req, res) {
  try {
    const buffer = await generateExcelTemplateBuffer();
    res.setHeader("Content-Disposition", "attachment; filename=questions_template.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteQuestionService(id, req.user.userId);
    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function exportQuestionsController(req, res) {
  try {
    const { roleCode } = req.query;
    const buffer = await exportQuestionsExcelService(roleCode);
    res.setHeader("Content-Disposition", `attachment; filename=questions_${roleCode.toUpperCase()}.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  addQuestion,
  listQuestions,
  getQuestionById,
  updateQuestion,
  activateQuestion,
  deactivateQuestion,
  importQuestions,
  uploadQuestionsController,
  uploadHistoryController,
  statsController,
  downloadExcelTemplateController,
  deleteQuestion,
  exportQuestionsController,
};
