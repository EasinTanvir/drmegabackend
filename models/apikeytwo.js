const mongoose = require("mongoose");

const apikeytwo = new mongoose.Schema({
  apikey: {
    type: String,
  },
});

module.exports = mongoose.model("apikeytwo", apikeytwo);
