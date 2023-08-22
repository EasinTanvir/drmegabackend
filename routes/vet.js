const express = require("express");
const router = express.Router();
const vetRoutes = require("../controllers/vet");

router.route("/vetgpt").post(vetRoutes.createVetGpt);
router.route("/automessage/vetgpt").post(vetRoutes.vetAutoMessageGenrator);
router.route("/fetchvetmessage").post(vetRoutes.getVetMessage);
router.route("/deletevet").post(vetRoutes.vetDeleteMessages);
router.route("/vet/createvetmessage").post(vetRoutes.createVetMessage);
router
  .route("/vet/creaetevetconversation")
  .post(vetRoutes.createVetConversation);
router.route("/vet/getvetconversation").post(vetRoutes.getVetConversation);

module.exports = router;
