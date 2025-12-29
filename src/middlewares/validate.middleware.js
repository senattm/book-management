const validate = (schema) => {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;

      next();
    } catch (error) {
      const err = new Error("Geçersiz input");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      const issues = error?.issues || [];

      err.details = issues.map((e) => {
        const path = (e.path || []).join(".");
        const field = path.replace(/^(body|query|params)\./, "");
        return {
          field,
          message: e.message,
        };
      });
      next(err);
    }
  };
};

module.exports = validate;