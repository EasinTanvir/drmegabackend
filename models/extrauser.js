const mongoose = require("mongoose");

const extra = new mongoose.Schema({
  user: { type: String },
  userId: { type: String },
  conversationId: { type: String },
});

module.exports = mongoose.model("extra", extra);
