const mongoose = require("mongoose");
const imagetotext = new mongoose.Schema({
  userId: { type: String, required: true },
  imagetext: { type: String },
  conversationId: { type: String },
});

module.exports = mongoose.model("imagetotext", imagetotext);
