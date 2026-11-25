function success(res, message, data = null, statusCode = 200, extra = null) {
  const payload = {
    success: true,
    message,
  };

  if (data !== null) {
    payload.data = data;
  }

  if (extra) {
    Object.assign(payload, extra);
  }

  return res.status(statusCode).json(payload);
}

function fail(res, message, statusCode = 400, extra = null) {
  const payload = {
    success: false,
    message,
  };

  if (extra) {
    Object.assign(payload, extra);
  }

  return res.status(statusCode).json(payload);
}

module.exports = { success, fail };
