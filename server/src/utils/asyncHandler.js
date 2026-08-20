// Wraps an async route handler so any thrown/rejected error is forwarded
// to next() automatically, instead of every controller needing its own
// try/catch. This is the single biggest source of "unhandled promise
// rejection" bugs in Express apps if left out.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
