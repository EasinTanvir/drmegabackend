const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripe");
const protectRoutes = require("../helper/protectRoutes");
const adminProtectRoutes = require("../helper/adminPrptect");
router.route("/price").get(protectRoutes, stripeController.productPrice);
router.route("/payment").post(protectRoutes, stripeController.createSession);
router
  .route("/filteruser")
  .get(protectRoutes, stripeController.filterUserStripe);
router.route("/billing").post(protectRoutes, stripeController.manageBillings);
router
  .route("/secret")
  .post(protectRoutes, adminProtectRoutes, stripeController.stripeSecretKey);
module.exports = router;
