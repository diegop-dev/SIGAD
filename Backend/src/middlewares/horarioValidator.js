/**
 * horarioValidator.js
 * Los endpoints de horarios son GET sin parámetros de cuerpo.
 * La autorización y el control de acceso se gestionan íntegramente
 * a través de verifyToken y requireRole en authMiddleware.js.
 */

// Middleware de paso: no hay campos de entrada que validar.
const validateHorarioQuery = (req, res, next) => next();

module.exports = { validateHorarioQuery };
