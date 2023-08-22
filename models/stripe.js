const mongoose = require("mongoose");
const stripekey = new mongoose.Schema({
  secretkey: { type: String, required: true },
});

module.exports = mongoose.model("stripekey", stripekey);
