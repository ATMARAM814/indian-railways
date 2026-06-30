const service = require("./counseling.service");

async function getCandidateCounselingController(req, res) {
  try {
    const { profileId } = req.params;
    const assessorId = req.user.userId;
    const assessorRole = req.user.role;
    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Missing candidate profileId."
      });
    }

    const data = await service.getCandidateCounselingData(profileId, assessorId, assessorRole);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

async function saveCandidateCounselingController(req, res) {
  try {
    const { profileId, statusList } = req.body;
    const markedBy = req.user.userId;
    const assessorRole = req.user.role;

    if (!profileId || !statusList) {
      return res.status(400).json({
        success: false,
        message: "Missing profileId or statusList in request body."
      });
    }

    const result = await service.saveCandidateCounselingData({
      profileId,
      statusList,
      markedBy,
      assessorRole
    });

    return res.status(200).json({
      success: true,
      message: "Counseling records saved successfully.",
      data: result
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

async function activateRetestController(req, res) {
  try {
    const { profileId } = req.body;
    const assessorId = req.user.userId;
    const assessorRole = req.user.role;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Missing candidate profileId in request body."
      });
    }

    const result = await service.activateRetestService({
      profileId,
      assessorId,
      assessorRole
    });

    return res.status(200).json({
      success: true,
      message: "Retest successfully activated! The candidate can now attempt their test. This test will remain active for 1 week.",
      data: result
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

async function getCounselingDirectoryController(req, res) {
  try {
    const assessorId = req.user.userId;
    const assessorRole = req.user.role;

    const data = await service.getCounselingDirectoryCandidatesService({ assessorId, assessorRole });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

async function getCandidateCounselingHistoryController(req, res) {
  try {
    const { profileId } = req.params;
    const assessorId = req.user.userId;
    const assessorRole = req.user.role;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Missing candidate profileId."
      });
    }

    const data = await service.getCandidateCounselingHistoryService({ profileId, assessorId, assessorRole });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

async function getEligibleCandidatesForSchedulingController(req, res) {
  try {
    const assessorId = req.user.userId;
    const assessorRole = req.user.role;
    const { search, station } = req.query;

    const data = await service.getEligibleCandidatesForScheduling({ assessorId, assessorRole, search, station });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

async function scheduleCounselingController(req, res) {
  try {
    const { profileId } = req.body;
    const scheduledBy = req.user.userId;
    const assessorRole = req.user.role;

    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Missing profileId in request body."
      });
    }

    const data = await service.scheduleCounseling({ profileId, scheduledBy, assessorRole });
    return res.status(200).json({
      success: true,
      message: "Counselling session scheduled successfully.",
      data
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

async function getScheduledCounselingListController(req, res) {
  try {
    const assessorId = req.user.userId;
    const assessorRole = req.user.role;

    const data = await service.getScheduledCounselingList({ assessorId, assessorRole });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

async function cancelScheduledCounselingController(req, res) {
  try {
    const { scheduleId } = req.params;
    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Missing scheduleId."
      });
    }

    const data = await service.cancelScheduledCounseling(scheduleId);
    return res.status(200).json({
      success: true,
      message: "Counselling session cancelled successfully.",
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

async function getRetestHistoryController(req, res) {
  try {
    const assessorId = req.user.userId;
    const assessorRole = req.user.role;

    const data = await service.getRetestHistory({ assessorId, assessorRole });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const statusCode = error.message.includes("Access Denied") ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  getCandidateCounselingController,
  saveCandidateCounselingController,
  activateRetestController,
  getCounselingDirectoryController,
  getCandidateCounselingHistoryController,
  getEligibleCandidatesForSchedulingController,
  scheduleCounselingController,
  getScheduledCounselingListController,
  cancelScheduledCounselingController,
  getRetestHistoryController
};
