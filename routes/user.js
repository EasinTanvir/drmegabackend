const express = require("express");
const router = express.Router();
const gptRoutes = require("../controllers/user");
const protectRoutes = require("../helper/protectRoutes");

router.route("/gpt").post(gptRoutes.createGpt);
router.route("/autogpt").post(gptRoutes.autoMessageGenrator);
router.route("/imagetotext").post(gptRoutes.imageToTextGenerator);
router.route("/symptomsgpt").post(gptRoutes.symptomsGenarator);
router.route("/pubmed").post(gptRoutes.pubmedArticles);
router.route("/gpts").post(gptRoutes.getMessage);
router.route("/message").post(gptRoutes.createMessage);
router.route("/extra").post(gptRoutes.createExtra);

router.route("/conversation").post(gptRoutes.createConversation);
router.route("/getconver").post(gptRoutes.getConversation);
router.route("/deletemessage").post(gptRoutes.deleteMessages);
router.route("/user/getconver").get(protectRoutes, gptRoutes.getConverHistory);
router
  .route("/user/getmessage")
  .get(protectRoutes, gptRoutes.getMessageHistory);
router.route("/user/getspam").get(protectRoutes, gptRoutes.getSpamHistory);
router.route("/user/updatepass").patch(protectRoutes, gptRoutes.updatePassord);

module.exports = router;
