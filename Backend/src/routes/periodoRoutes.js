const express = require("express");
const router = express.Router();
const controller = require("../controllers/periodoController");

router.post("/", controller.createPeriodo);
router.get("/", controller.getPeriodos);
router.put("/:id", controller.updatePeriodo);
router.delete("/:id", controller.deletePeriodo);

module.exports = router;