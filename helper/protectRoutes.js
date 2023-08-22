const HttpError = require("../helper/HttpError");
const jwt = require("jsonwebtoken");
module.exports = async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  let token;

  try {
    token = req.headers.authorization.split(" ")[1];

    if (!token) {
      const errors = new HttpError("find token failed", 500);
      return next(errors);
    }
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);
    req.userData = { id: decodedToken.id, isAdmin: decodedToken.isAdmin };
    next();
  } catch (err) {
    const errors = new HttpError(
      "Your token has been expired. Please LogIn again",
      404
    );
    return next(errors);
  }
};
