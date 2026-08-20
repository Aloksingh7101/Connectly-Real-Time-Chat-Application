const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after express-validator's check(...) chains; turns their errors
// into our standard ApiError shape instead of a raw validator array.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(new ApiError(400, message));
  }
  next();
}

module.exports = validate;
