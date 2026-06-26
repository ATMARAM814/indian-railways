const { logAction } = require("../modules/audit/audit.service");

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      logAction({
        performedBy: req.user ? req.user.userId : null,
        actionType: "UNAUTHORIZED_ACCESS_ATTEMPT",
        moduleName: "Auth",
        entityType: "SYSTEM",
        severity: "CRITICAL",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        remarks: `User (HRMS ID: ${req.user ? req.user.hrmsId : "Unknown"}, Role: ${req.user ? req.user.role : "None"}) tried to access a resource requiring roles: ${allowedRoles.join(", ")}.`
      }).catch(err => console.error("Failed to log unauthorized access:", err));

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
}

module.exports = {
  authorize,
};