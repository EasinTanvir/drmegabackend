const mongoose = require("mongoose");

const apikeyone = new mongoose.Schema({
  apikey: {
    type: String,
  },
});

module.exports = mongoose.model("apikeyone", apikeyone);
