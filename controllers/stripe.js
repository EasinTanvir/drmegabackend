const stripe = require("../utils/stripe");
const USER = require("../models/auth");
const GUSER = require("../models/googleauth");
const HttpError = require("../helper/HttpError");
const STRIPEKEY = require("../models/stripe");

const productPrice = async (req, res, next) => {
  let prices;

  try {
    prices = await stripe.prices.list({
      apiKey: process.env.STRIPE_SECRET_KEY,
    });
  } catch (err) {
    const errors = new HttpError("Fetch products failed from stripe", 500);
    return next(errors);
  }

  res.status(201).json(prices);
};
const stripeSecretKey = async (req, res, next) => {
  let exisitingKey;

  try {
    exisitingKey = await STRIPEKEY.find();
  } catch (err) {
    const errors = new HttpError("find stripe key failed", 500);
    return next(errors);
  }

  if (exisitingKey.length === 0) {
    try {
      await STRIPEKEY.create(req.body);
    } catch (err) {
      const errors = new HttpError("Fetch products failed from stripe", 500);
      return next(errors);
    }
  } else {
    exisitingKey[0].secretkey = req.body.secretkey;
    try {
      await exisitingKey[0].save();
    } catch (err) {
      const errors = new HttpError("stripe key update failed", 500);
      return next(errors);
    }
  }

  res.status(201).json({ message: "stripe key created successfull" });
};

const createSession = async (req, res, next) => {
  const { customerId, productId } = req.body;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      payment_method_types: ["card", "cashapp", "us_bank_account"],
      line_items: [
        {
          price: productId,
          quantity: 1,
        },
      ],

      success_url: `${process.env.Client_Url}/success`,
      cancel_url: `${process.env.Client_Url}/error`,
      customer: customerId,
    },
    {
      apiKey: process.env.STRIPE_SECRET_KEY,
    }
  );

  res.status(201).json(session);
};

const filterUserStripe = async (req, res, next) => {
  let user;
  try {
    user = await USER.findOne({ extraId: req.userData.id });

    if (!user) {
      user = await GUSER.findOne({ extraId: req.userData.id });
    }
  } catch (err) {
    const errors = new HttpError("Fetch users failed", 500);
    return next(errors);
  }

  const subscription = await stripe.subscriptions.list(
    {
      customer: user.customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    },
    {
      apiKey: process.env.STRIPE_SECRET_KEY,
    }
  );

  res.json(subscription.data[0]);
};

const manageBillings = async (req, res) => {
  const { customerId } = req.body;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
    });

    res.status(201).json(session.url);
  } catch (error) {
    console.error("Error generating billing portal link:", error.message);
    throw error;
  }
};

module.exports = {
  productPrice,
  createSession,
  filterUserStripe,
  manageBillings,
  stripeSecretKey,
};
