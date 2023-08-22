const express = require("express");
const HttpError = require("./helper/HttpError");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
const cors = require("cors");
const gptRoutes = require("./routes/user");
const vetRoutes = require("./routes/vet");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const { Configuration, OpenAIApi } = require("openai");
const APIONE = require("./models/apikey");
const APITWO = require("./models/apikeytwo");
const APITHREE = require("./models/apikeythree");
const StripeRoutes = require("./routes/stripe");

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => console.log(err));

app.use(async (req, res, next) => {
  try {
    const user = await APIONE.findOne();
    if (!user) {
      const openApi = new OpenAIApi(
        new Configuration({
          apiKey: process.env.Secret_Key,
        })
      );
      app.set("gpt", openApi);
    } else {
      const openApi = new OpenAIApi(
        new Configuration({
          apiKey: user.apikey,
        })
      );
      app.set("gpt", openApi);
    }
  } catch (err) {
    const errors = new HttpError("No Api Key Found", 500);
    return next(errors);
  }

  next();
});
app.use(async (req, res, next) => {
  try {
    const user = await APITWO.findOne();

    if (!user) {
      const openApi = new OpenAIApi(
        new Configuration({
          apiKey: process.env.Secret_Key2,
        })
      );
      app.set("gpt2", openApi);
    } else {
      const openApi = new OpenAIApi(
        new Configuration({
          apiKey: user.apikey,
        })
      );
      app.set("gpt2", openApi);
    }
  } catch (err) {
    const errors = new HttpError("No Api Key Found", 500);
    return next(errors);
  }

  next();
});
app.use(async (req, res, next) => {
  try {
    const user = await APITHREE.findOne();
    if (!user) {
      const openApi = new OpenAIApi(
        new Configuration({
          apiKey: process.env.Secret_Key3,
        })
      );
      app.set("gpt3", openApi);
    } else {
      const openApi = new OpenAIApi(
        new Configuration({
          apiKey: user.apikey,
        })
      );
      app.set("gpt3", openApi);
    }
  } catch (err) {
    const errors = new HttpError("No Api Key Found", 500);
    return next(errors);
  }

  next();
});

app.use(gptRoutes);
app.use(vetRoutes);
app.use(authRoutes);
app.use(adminRoutes);
app.use("/stripe", StripeRoutes);

// app.post("/api/payment", protectRoutes, async (req, res) => {
//   const { email, paymentMethodId } = req.body;

//   try {
//     const customer = await stripe.customers.create({
//       email: email,
//       payment_method: paymentMethodId, // The payment method ID obtained from Stripe Elements or the Payment Request API
//       invoice_settings: {
//         default_payment_method: paymentMethodId, // Set the default payment method for invoices
//       },
//     });

//     console.log(customer.id);
//   } catch (error) {
//     console.log(error.message);
//   }

//   try {
//     const session = await stripe.checkout.sessions.create({
//       billing_address_collection: "auto",
//       customer_email: req.body.email,
//       payment_method_types: ["card", "cashapp", "us_bank_account"],
//       line_items: [
//         {
//           price: Price_Key,
//           // For metered billing, do not pass quantity
//           quantity: 1,
//         },
//       ],
//       mode: "subscription",
//       success_url: `${process.env.Server_Url}/paymentsucc/${req.userData.id}`,
//       cancel_url: `${process.env.Server_Url}/paymenterror`,
//     });
//     const customerId = session.customer;

//     console.log(session.object);

//     res.status(201).json({ url: session });
//   } catch (err) {
//     res.status(500).json({ err });
//   }
// });

//payment handler

app.use((req, res, next) => {
  const errors = new HttpError("No route found for this paths", 404);
  return next(errors);
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "unknown error occured" });
});

app.listen(process.env.PORT, () => {
  console.log("server runninng");
});
