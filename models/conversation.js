const mongoose = require("mongoose");

const conversation = new mongoose.Schema({
  userId: { type: String, required: true },
});

module.exports = mongoose.model("conversation", conversation);
