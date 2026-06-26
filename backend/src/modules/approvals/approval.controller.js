const {
  listPendingApprovals,
  approveAssessmentService,
  rejectAssessmentService,
  modifyAssessmentService,
} = require("./approval.service");

async function getPendingApprovalsController(req, res) {
  try {
    const approvals = await listPendingApprovals(
      req.user.userId,
      req.user.role
    );

    return res.status(200).json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function approveAssessmentController(
  req,
  res
) {
  try {
    const { assessmentId } = req.params;
    const { approvalRemark } = req.body;

    const assessment =
      await approveAssessmentService(
        assessmentId,
        req.user.userId,
        req.user.role,
        approvalRemark
      );

    return res.status(200).json({
      success: true,
      message:
        "Assessment approved successfully",
      data: assessment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function rejectAssessmentController(req, res) {
  try {
    const { assessmentId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const assessment =
      await rejectAssessmentService(
        assessmentId,
        req.user.userId,
        req.user.role,
        rejectionReason
      );

    return res.status(200).json({
      success: true,
      message: "Assessment rejected successfully",
      data: assessment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

async function modifyAssessmentController(req, res) {
  try {
    const { assessmentId } = req.params;
    const {
      scores,
      modificationRemark,
    } = req.body;

    if (!scores) {
      return res.status(400).json({
        success: false,
        message: "scores are required",
      });
    }

    const assessment =
      await modifyAssessmentService(
        assessmentId,
        req.user.userId,
        req.user.role,
        scores,
        modificationRemark
      );

    return res.status(200).json({
      success: true,
      message: "Assessment modified successfully",
      data: assessment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getPendingApprovalsController,
  approveAssessmentController,
  rejectAssessmentController,
  modifyAssessmentController,
};