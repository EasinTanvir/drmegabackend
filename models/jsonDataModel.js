const mongoose = require("mongoose");
const dataSchema = new mongoose.Schema({
  // Define the fields and their types

  type: String,
  project_id: String,
  private_key_id: String,
  private_key: String,
  client_email: String,
  client_id: String,
  auth_uri: String,
  token_uri: String,
  auth_provider_x509_cert_url: String,
  client_x509_cert_url: String,
  universe_domain: String,

  // ... add more fields as necessary
});

// Create a Mongoose model based on the schema
module.exports = mongoose.model("jsonData", dataSchema);
