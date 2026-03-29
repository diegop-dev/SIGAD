const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const cuatrimestreController = require("../controllers/cuatrimestreController");

// ─── EP-03 SESA: GET /cuatrimestres/catalogo ──────────────────────────────────────────
router.get("/catalogo", verifyToken, cuatrimestreController.ObtenerCuatrimestres);
// ─────────────────────────────────────────────────────────────────────────────

router.get("/", verifyToken, cuatrimestreController.getCuatrimestres);
router.get("/sincronizacion", verifyToken, cuatrimestreController.getCuatrimestres);

module.exports = router;