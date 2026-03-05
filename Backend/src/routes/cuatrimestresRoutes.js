const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const cuatrimestreController = require("../controllers/cuatrimestreController");

router.get("/", verifyToken, cuatrimestreController.getCuatrimestres);

module.exports = router;