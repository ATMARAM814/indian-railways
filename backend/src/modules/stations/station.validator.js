// station.validator.js
const validateStationId = (req, res, next) => {
  const { stationId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!stationId || !uuidRegex.test(stationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid station ID format. Must be a valid UUID.",
    });
  }
  next();
};

module.exports = {
  validateStationId,
};
