const mongoose = require('mongoose');

/**
 * Helper to check if a single value is a valid 24-character hex MongoDB ObjectId
 * @param {any} val
 * @returns {boolean}
 */
const isValidObjectId = (val) => {
  if (!val || typeof val !== 'string') return false;
  if (!mongoose.Types.ObjectId.isValid(val)) return false;
  try {
    return String(new mongoose.Types.ObjectId(val)) === val;
  } catch {
    return false;
  }
};

/**
 * Middleware to validate MongoDB ObjectId parameters in req.params or req.query.
 * @param {string[]} paramNames - Array of param/query keys to validate
 * @param {'params'|'query'|'body'} [source='params'] - Location of the parameters
 */
const validateObjectId = (paramNames = ['id'], source = 'params') => {
  return (req, res, next) => {
    const target = req[source];
    if (!target) return next();

    for (const param of paramNames) {
      const value = target[param];
      if (value !== undefined && value !== null && value !== '') {
        if (!isValidObjectId(value)) {
          return res.status(400).json({
            message: `Invalid ID format for parameter: ${param}`,
          });
        }
      }
    }
    next();
  };
};

module.exports = { validateObjectId, isValidObjectId };
