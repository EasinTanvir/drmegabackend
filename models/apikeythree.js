const mongoose = require("mongoose");

const apikeythree = new mongoose.Schema({
  apikey: {
    type: String,
  },
});

module.exports = mongoose.model("apikeythree", apikeythree);
