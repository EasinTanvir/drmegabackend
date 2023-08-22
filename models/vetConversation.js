const mongoose = require("mongoose");

const vetConversation = new mongoose.Schema({
  userId: { type: String, required: true },
});

module.exports = mongoose.model("vetConversation", vetConversation);
