import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware de autenticación básica
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ 
      code: 401,
      message: "Token de autenticación requerido" 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        code: 403,
        message: "Token inválido o expirado" 
      });
    }
    req.user = user; 
    next();
  });
}

// Middleware para verificar roles
export function checkRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        code: 401,
        message: "Autenticación requerida" 
      });
    }

    if (req.user.rol_id !== requiredRole) {
      return res.status(403).json({ 
        code: 403,
        message: "No tienes permisos para esta acción" 
      });
    }

    next();
  };
}

// Versión alternativa que permite múltiples roles
export function checkRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        code: 401,
        message: "Autenticación requerida" 
      });
    }

    if (!allowedRoles.includes(req.user.rol_id)) {
      return res.status(403).json({ 
        code: 403,
        message: "No tienes permisos para esta acción" 
      });
    }

    next();
  };
}

// Middleware para verificar si es el mismo usuario o admin
export function checkUserOrAdmin() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        code: 401,
        message: "Autenticación requerida" 
      });
    }

    const requestedUserId = parseInt(req.params.id);
    if (req.user.id !== requestedUserId && req.user.rol_id !== 1) {
      return res.status(403).json({ 
        code: 403,
        message: "Solo puedes acceder a tu propia información a menos que seas administrador" 
      });
    }

    next();
  };
}