const { sendError } = require('../utils/response');

/**
 * Zod validation middleware for Express
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req[source]);

      if (!parsed.success) {
        const formattedErrors = parsed.error.issues.map((err) => ({
          field: err.path.join('.') || 'field',
          message: err.message,
        }));

        return sendError(
          res,
          'Validation failed',
          'VALIDATION_ERROR',
          formattedErrors,
          400
        );
      }

      // Replace source with validated & transformed data
      req[source] = parsed.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};

validate.validate = validate;
module.exports = validate;
