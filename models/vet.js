const mongoose = require("mongoose");

const vet = new mongoose.Schema({
  vetgpt: { type: String, required: true },
  user: { type: String, required: true },
  automessage: { type: Array, default: [] },
  userId: { type: String },
  conversationId: { type: String },
  spam: { type: Boolean, default: false },
});

module.exports = mongoose.model("vet", vet);
