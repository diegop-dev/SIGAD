const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { getLogs, exportAuditPDF }  = require('../controllers/auditController');

router.get('/',       verifyToken, requireRole([1]), getLogs);
router.get('/export', verifyToken, requireRole([1]), exportAuditPDF);

module.exports = router;