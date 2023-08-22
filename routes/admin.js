const express = require("express");
const router = express.Router();
const adminRoutes = require("../controllers/admin");
const protectRoutes = require("../helper/protectRoutes");
const adminProtectRoutes = require("../helper/adminPrptect");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
router
  .route("/admin/getuser/:id")
  .get(protectRoutes, adminProtectRoutes, adminRoutes.getUserProfile);
router
  .route("/admin/getconver/:id")
  .get(protectRoutes, adminProtectRoutes, adminRoutes.getConverHistory);
router
  .route("/admin/getmessage/:id")
  .get(protectRoutes, adminProtectRoutes, adminRoutes.getMessageHistory);
router
  .route("/admin/getallmessage")
  .get(protectRoutes, adminProtectRoutes, adminRoutes.getAllMessages);
router
  .route("/admin/spam")
  .patch(protectRoutes, adminProtectRoutes, adminRoutes.spamMessage);
router
  .route("/admin/blockuser")
  .patch(protectRoutes, adminProtectRoutes, adminRoutes.blockUser);
router
  .route("/admin/updateadmin")
  .patch(protectRoutes, adminProtectRoutes, adminRoutes.updateAdminUser);
router
  .route("/admin/allusers")
  .get(protectRoutes, adminProtectRoutes, adminRoutes.getAdminUsers);
router
  .route("/admin/allconver")
  .get(protectRoutes, adminProtectRoutes, adminRoutes.getAdminConversations);
router
  .route("/admin/allmessage")
  .get(protectRoutes, adminProtectRoutes, adminRoutes.getAdminMessages);
router
  .route("/gpt/apione")
  .patch(protectRoutes, adminProtectRoutes, adminRoutes.updateApiOne);
router
  .route("/gpt/apitwo")
  .patch(protectRoutes, adminProtectRoutes, adminRoutes.updateApiTwo);
router
  .route("/gpt/apithree")
  .patch(protectRoutes, adminProtectRoutes, adminRoutes.updateApiThree);
router
  .route("/gpt/upload/json")
  .post(
    protectRoutes,
    adminProtectRoutes,
    upload.single("file"),
    adminRoutes.updateJsonApiKey
  );

module.exports = router;
