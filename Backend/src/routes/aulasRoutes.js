const express = require('express');
const router = express.Router();
const { actualizarAula, consultarAulas, registrarAula, desactivarAula, ObtenerAulas } = require('../controllers/aulaController');
const { validarActualizacionAula } = require('../middlewares/aulaValidator');

// ─── EP-09 SESA: GET /aulas/catalogo ───────────────────────────────────────────────────
router.get('/catalogo', ObtenerAulas);
// ─────────────────────────────────────────────────────────────────────────────

router.post('/registrar', registrarAula);
router.get('/consultar', consultarAulas);
router.patch('/actualizar/:id', validarActualizacionAula, actualizarAula);
router.patch('/desactivar/:id', desactivarAula);

module.exports = router;