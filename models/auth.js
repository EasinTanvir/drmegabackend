const mongoose = require("mongoose");

const auth = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  isPaid: { type: Boolean, default: false },
  customerId: { type: String, required: true },
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
  extraId: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  vetmessages: [{ type: mongoose.Types.ObjectId, ref: "vet" }],
  messages: [{ type: mongoose.Types.ObjectId, ref: "message" }],
});

module.exports = mongoose.model("auth", auth);
