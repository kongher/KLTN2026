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
    } else if (fields.includes("code")) {
      message = "Coupon code already exists";
    } else {
      message = "Duplicate value";
    }
  }

  if (err.code === "P2021" || err.code === "P2022") {
    statusCode = 503;
    message =
      "Database schema is out of date. Run Prisma migrations on the server and restart the backend.";
  }

  if (err.code === "P2003") {
    statusCode = 400;
    message = "Related record not found";
  }

  if (statusCode >= 500 && !err.isOperational) {
    console.error(err);
  } else if (statusCode >= 500) {
    console.error(`[operational ${statusCode}]`, message);
  }

  const schemaOutOfDate = err.code === "P2021" || err.code === "P2022";
  const clientMessage =
    err.isOperational || statusCode < 500 || schemaOutOfDate ? message : "Internal server error";

  const payload = {
    success: false,
    message: clientMessage,
  };

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
