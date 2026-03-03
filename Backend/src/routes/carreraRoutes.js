const express = require("express");
const router = express.Router();
const { getCarreras } = require("../controllers/carreraController");

router.get("/", getCarreras);

module.exports = router;