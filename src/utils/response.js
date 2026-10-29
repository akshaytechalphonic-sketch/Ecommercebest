/**
 * Standard API Response Utilities
 */

const sendSuccess = (res, message = "Operation completed successfully", data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = "An error occurred", code = "ERROR", errors = [], statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
