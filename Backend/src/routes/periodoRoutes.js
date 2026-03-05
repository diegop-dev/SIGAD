const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const periodoController = require("../controllers/periodoController");

router.get("/", verifyToken, periodoController.getPeriodos);

module.exports = router;