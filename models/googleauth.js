const mongoose = require("mongoose");

const auth = new mongoose.Schema({
  email: { type: String, required: true },
  userId: { type: String, required: true },
  customerId: { type: String, required: true },
  extraId: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  messages: [{ type: mongoose.Types.ObjectId, ref: "message" }],
  vetmessages: [{ type: mongoose.Types.ObjectId, ref: "vet" }],
});

module.exports = mongoose.model("gauth", auth);
