const HttpError = require("../helper/HttpError");
module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  if (req.userData && req.userData.isAdmin) {
    next();
  } else {
    const errors = new HttpError("sorry you are not an Admin", 500);
    return next(errors);
  }
};
