const express = require('express');
const router = express.Router();
const externalController = require('../controllers/externalController');

router.get('/sincronizacion', externalController.getSincronizacionCatalogos);

module.exports = router;