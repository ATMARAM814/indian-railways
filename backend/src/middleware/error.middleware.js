function globalErrorHandler(err, req, res, next) {
  // Log the full error on the server
  console.error("[Unhandled Error]:", err);

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Check if it looks like a PostgreSQL database error (e.g. error code or stack signature)
  const isDatabaseError = err.code || err.severity || (err.stack && err.stack.includes("pg/lib"));

  let userMessage = err.message || "An internal server error occurred.";

  if (isProduction && isDatabaseError) {
    userMessage = "An internal database error occurred. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = {
  globalErrorHandler,
};
