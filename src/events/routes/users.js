const express = require("express");
const router = express.Router();

// services
const { UserWebhookController } = require("../services");

// routes
router.get("/users", UserWebhookController.webhookInit);

// Listen to events
router.post("/users", UserWebhookController.webhookReceiver);

module.exports = router;

//$2b$10$lxP3xA/iwpOsvSl70g6eTusuEf8A6lW9D124leKLnfHlEVAzNjsr6