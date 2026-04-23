const express = require("express");
const router  = express.Router();
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { validatePeriodo }          = require("../middlewares/periodoValidator");
const periodoController            = require("../controllers/periodoController");

// ─── EP-01 SESA: GET /periodos/activo ────────────────────────────────────────
// Declarada antes de /:id para evitar colisión de parámetros en Express.
router.get(
  "/activo",
  periodoController.ObtenerPeriodoActivo
);
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/",
  verifyToken,
  periodoController.getPeriodos
);

router.post(
  "/",
  verifyToken,
  requireRole([1, 2]),
  validatePeriodo,
  periodoController.createPeriodo
);

router.put(
  "/:id",
  verifyToken,
  requireRole([1, 2]),
  validatePeriodo,
  periodoController.updatePeriodo
);

router.delete(
  "/:id",
  verifyToken,
  requireRole([1]),
  periodoController.deletePeriodo
);

router.patch(
  "/:id",
  verifyToken,
  requireRole([1]),
  periodoController.togglePeriodo
);

router.patch(
  "/:id/toggle",
  verifyToken,
  requireRole([1]),
  periodoController.togglePeriodo
);

module.exports = router;