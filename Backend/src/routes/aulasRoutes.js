const express = require('express');
const router = express.Router();
const { actualizarAula, consultarAulas, registrarAula, desactivarAula,reactivarAula, ObtenerAulas } = require('../controllers/aulaController');
const { validarActualizacionAula } = require('../middlewares/aulaValidator');

// ─── EP-09 SESA: GET /aulas/catalogo ───────────────────────────────────────────────────
router.get('/catalogo', ObtenerAulas);
// ─────────────────────────────────────────────────────────────────────────────

router.post('/registrar', registrarAula);
router.get('/consultar', consultarAulas);
router.patch('/actualizar/:id', validarActualizacionAula, actualizarAula);
router.patch('/desactivar/:id', desactivarAula);
router.patch('/reactivar/:id', reactivarAula);

module.exports = router;