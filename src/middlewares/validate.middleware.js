const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      const err = new Error("Geçersiz input");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";

      const issues = error?.errors || error?.issues || [];

      err.details = error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      next(err);
    }
  };
};

module.exports = validate;