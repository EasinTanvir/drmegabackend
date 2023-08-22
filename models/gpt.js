const mongoose = require("mongoose");

const message = new mongoose.Schema({
  gpt: { type: String, required: true },
  user: { type: String },
  automessage: { type: Array, default: [] },
  userId: { type: String },
  conversationId: { type: String },
  spam: { type: Boolean, default: false },
});

module.exports = mongoose.model("message", message);
