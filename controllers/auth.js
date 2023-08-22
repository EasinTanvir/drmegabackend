const USER = require("../models/auth");
const GUSER = require("../models/googleauth");
const bcrypt = require("bcryptjs");
const HttpError = require("../helper/HttpError");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const stripe = require("../utils/stripe");

const createUser = async (req, res, next) => {
  const { email, password, extraId } = req.body;

  let exisitingUser;

  try {
    exisitingUser = await USER.findOne({ email });
  } catch (err) {
    const errors = new HttpError("find existing user failed", 500);
    return next(errors);
  }

  if (exisitingUser) {
    const errors = new HttpError(
      "An account with that email already exists. Please try another email.",
      500
    );
    return next(errors);
  }

  if (password.trim().length < 6) {
    const errors = new HttpError(
      "Password should be at least 6 characters.",
      500
    );
    return next(errors);
  }

  let hashPass;

  try {
    hashPass = await bcrypt.hash(password, 12);
  } catch (err) {
    const errors = new HttpError("hash password failed", 500);
    return next(errors);
  }

  //customer key
  let customer;
  try {
    customer = await stripe.customers.create(
      {
        email: req.body.email,
      },
      {
        apiKey: process.env.STRIPE_SECRET_KEY,
      }
    );
  } catch (err) {
    const errors = new HttpError("create customer failed in stripe", 500);
    return next(errors);
  }
  //customer key

  let user;

  try {
    user = await USER.create({
      ...req.body,
      password: hashPass,
      customerId: customer.id,
    });
  } catch (err) {
    const errors = new HttpError("create user failed", 500);
    return next(errors);
  }

  user.extraId = extraId;
  let result;
  try {
    result = await user.save();
  } catch (err) {
    const errors = new HttpError("update extra id failed", 500);
    return next(errors);
  }

  res.status(200).json({
    id: result._id,
    email: result.email,
    extraId: result.extraId,
  });
};

const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  let user;

  try {
    user = await USER.findOne({
      email,
    });
  } catch (err) {
    const errors = new HttpError("find user failed", 500);
    return next(errors);
  }

  if (!user) {
    const errors = new HttpError(
      "We could not find an account with that email. Try another email, or create a new account.",
      500
    );
    return next(errors);
  }

  let hashPass;

  try {
    hashPass = await bcrypt.compare(password, user.password);
  } catch (err) {
    const errors = new HttpError("compare  password failed", 500);
    return next(errors);
  }

  if (!hashPass) {
    const errors = new HttpError(
      "Incorrect password. Your email is correct, but try another password.",
      500
    );
    return next(errors);
  }

  let token;
  try {
    token = jwt.sign(
      {
        id: user.extraId,
        token: token,
        isAdmin: user.isAdmin,
        customerId: user.customerId,
      },
      process.env.TOKEN_KEY,
      {
        expiresIn: "24h",
      }
    );
  } catch (err) {
    const errors = new HttpError("create token failed", 500);
    return next(errors);
  }

  res.status(200).json({
    id: user.extraId,
    email: user.email,
    token: token,
    isAdmin: user.isAdmin,
    isPaid: user.isPaid,
    customerId: user.customerId,
  });
};

const googleSignIn = async (req, res, next) => {
  const { userId, email, extraId } = req.body;
  let findUser;

  let user;
  try {
    findUser = await GUSER.find({ userId: userId });
  } catch (err) {
    console.log(err);
  }

  if (findUser.length === 0) {
    let customer;
    try {
      customer = await stripe.customers.create(
        {
          email: req.body.email,
        },
        {
          apiKey: process.env.STRIPE_SECRET_KEY,
        }
      );
    } catch (err) {
      const errors = new HttpError("create customer failed in stripe", 500);
      return next(errors);
    }

    try {
      user = await GUSER.create({
        email,
        userId,
        extraId,
        customerId: customer.id,
      });
    } catch (err) {
      const errors = new HttpError("create user failed", 500);
      return next(errors);
    }
  } else {
    try {
      user = await GUSER.findOne({ userId: userId });
    } catch (err) {
      const errors = new HttpError("find user failed", 500);
      return next(errors);
    }
  }

  let token;
  try {
    token = jwt.sign(
      {
        id: user.extraId,
        token: token,
        isAdmin: user.isAdmin,
        customerId: user.customerId,
      },
      process.env.TOKEN_KEY,
      {
        expiresIn: "24h",
      }
    );
  } catch (err) {
    const errors = new HttpError("create token failed", 500);
    return next(errors);
  }

  res.status(200).json({
    id: user.extraId,
    email: user.email,
    token: token,
    isAdmin: user.isAdmin,
    isPaid: user.isPaid,
    customerId: user.customerId,
  });
};

const passReset = async (req, res, next) => {
  let user;

  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      const errors = new HttpError("crypto failed", 500);
      return next(errors);
    }
    const token = buffer.toString("hex");

    try {
      user = await USER.findOne({ email: req.body.email });
    } catch (err) {
      const errors = new HttpError("find user failed", 500);
      return next(errors);
    }
    if (!user) {
      const errors = new HttpError("Invalid Email Address", 500);
      return next(errors);
    }
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 3600000;

    let newUser;
    try {
      newUser = await user.save();
    } catch (err) {
      const errors = new HttpError("find user failed", 500);
      return next(errors);
    }

    res.status(200).json(newUser.resetToken);
  });
};

const getUpdatePasswordToken = async (req, res, next) => {
  const params = req.params.id;

  let user;
  try {
    user = await USER.findOne({
      resetToken: params,
      resetTokenExpire: { $gt: new Date() },
    });
  } catch (err) {
    const errors = new HttpError("find token failed", 500);
    return next(errors);
  }

  if (!user) {
    const errors = new HttpError("Sorry your token is Invalid", 500);
    return next(errors);
  }

  if (req.body.password.trim().length < 6) {
    const errors = new HttpError(
      "Password should be at least 6 characters.",
      500
    );
    return next(errors);
  }

  let hashPass;

  try {
    hashPass = await bcrypt.hash(req.body.password, 12);
  } catch (err) {
    const errors = new HttpError("hash password failed", 500);
    return next(errors);
  }
  user.password = hashPass;

  let result;

  try {
    result = await user.save();
  } catch (err) {
    const errors = new HttpError("update password failed", 500);
    return next(errors);
  }

  res.status(200).json({ result: "Password update successfull" });
};

module.exports = {
  createUser,
  signIn,
  googleSignIn,
  passReset,
  getUpdatePasswordToken,
};
