const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Se requiere un token de autenticación válido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Inyecta id_usuario y rol_id en la petición
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'El token ha expirado. Por favor, inicie sesión nuevamente.' });
    }
    return res.status(401).json({ error: 'Token inválido o corrupto.' });
  }
};

// Utilidad extra para control de acceso basado en roles (RBAC)
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol_id)) {
      return res.status(403).json({ error: 'No cuenta con los privilegios necesarios para ejecutar esta acción.' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
