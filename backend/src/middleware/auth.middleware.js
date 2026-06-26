const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

function enforcePasswordChange(req, res, next) {
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({
      success: false,
      message: "You must change your password before accessing this resource",
    });
  }
  next();
}

module.exports = {
  authenticate,
  enforcePasswordChange,
};