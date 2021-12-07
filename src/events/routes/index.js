const express = require("express");
const router = express.Router();

// routes
router.use("/", require("./ad-accounts"));

module.exports = {
    prefix: "/webhooks",
    router: router,
};