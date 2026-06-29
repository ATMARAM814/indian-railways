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

module.exports = {
  getCandidateCounselingController,
  saveCandidateCounselingController,
  activateRetestController,
  getCounselingDirectoryController,
  getCandidateCounselingHistoryController
};
