const AppError = require("../utils/appError");

function validate(getErrors) {
  return (req, res, next) => {
    try {
      const errors = getErrors(req) || [];
      if (errors.length > 0) {
        throw new AppError(errors[0], 400);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = validate;
