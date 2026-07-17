// validator.middleware.js
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  // Replace HTML tag structures with entities or remove them to prevent XSS
  return str.replace(/<[^>]*>/g, "");
};

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeString(req.body[key]);
      } else if (Array.isArray(req.body[key])) {
        req.body[key] = req.body[key].map(item => {
          if (typeof item === "object" && item !== null) {
            for (const subKey of Object.keys(item)) {
              if (typeof item[subKey] === "string") {
                item[subKey] = sanitizeString(item[subKey]);
              }
            }
            return item;
          }
          return typeof item === "string" ? sanitizeString(item) : item;
        });
      } else if (typeof req.body[key] === "object" && req.body[key] !== null) {
        for (const subKey of Object.keys(req.body[key])) {
          if (typeof req.body[key][subKey] === "string") {
            req.body[key][subKey] = sanitizeString(req.body[key][subKey]);
          }
        }
      }
    }
  }
  next();
};

const validateUuidParam = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (value && !uuidRegex.test(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID parameter format. Must be a valid UUID.`,
      });
    }
    next();
  };
};

module.exports = {
  sanitizeInput,
  validateUuidParam,
};
