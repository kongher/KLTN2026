function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.code === "P2002") {
    statusCode = 409;
    const fields = err.meta?.target || [];
    if (fields.includes("email")) {
      message = "Email already exists";
    } else if (fields.includes("phone")) {
      message = "Phone already exists";
    } else {
      message = "Duplicate value";
    }
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  const payload = {
    success: false,
    message: statusCode >= 500 ? "Internal server error" : message,
  };

  if (statusCode < 500) {
    payload.message = message;
  }

  return res.status(statusCode).json(payload);
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
