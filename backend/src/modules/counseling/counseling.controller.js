const service = require("./counseling.service");

async function getCandidateCounselingController(req, res) {
  try {
    const { profileId } = req.params;
    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Missing candidate profileId."
      });
    }

    const data = await service.getCandidateCounselingData(profileId);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

async function saveCandidateCounselingController(req, res) {
  try {
    const { profileId, statusList } = req.body;
    const markedBy = req.user.userId;

    if (!profileId || !statusList) {
      return res.status(400).json({
        success: false,
        message: "Missing profileId or statusList in request body."
      });
    }

    const result = await service.saveCandidateCounselingData({
      profileId,
      statusList,
      markedBy
    });

    return res.status(200).json({
      success: true,
      message: "Counseling records saved successfully.",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  getCandidateCounselingController,
  saveCandidateCounselingController
};
