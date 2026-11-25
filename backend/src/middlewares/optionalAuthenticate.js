const authenticate = require("./authenticate");

function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }
  return authenticate(req, res, next);
}

module.exports = optionalAuthenticate;
