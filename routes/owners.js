import express from "express";
import db from "../config/db.js";
import { authenticateToken, checkRole, checkUserOrAdmin } from "../middleware/auth.js";

const ownersRouter = express.Router();

// Registro de dueño (no requiere autenticación)
ownersRouter.post('/', async (req, res) => {
  try {
    const { nombre, email, password, telefono, direccion } = req.body;

    // Validación básica
    if (!nombre || !email || !password) {
      return res.status(400).json({
        code: 400,
        message: "Nombre, email y password son requeridos"
      });
    }

    // Verificar si el email ya existe
    const existingUser = await db.get(
      "SELECT id FROM USUARIOS WHERE email = ?", 
      [email]
    );
    
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: "El email ya está registrado"
      });
    }

    // Insertar nuevo dueño (rol_id 3 = dueño)
    const result = await db.run(
      `INSERT INTO USUARIOS 
       (nombre, email, password, telefono, direccion, rol_id) 
       VALUES (?, ?, ?, ?, ?, 3)`,
      [nombre, email, password, telefono || null, direccion || null]
    );

    res.status(201).json({
      code: 201,
      message: "Dueño registrado exitosamente",
      data: {
        id: result.lastID,
        nombre,
        email,
        rol_id: 3
      }
    });

  } catch (err) {
    console.error("Error en registro de dueño:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Lista de dueños (solo admin)
ownersRouter.get('/', authenticateToken, checkRole(1), async (req, res) => {
  try {
    const owners = await db.all(
      `SELECT id, nombre, email, telefono, direccion 
       FROM USUARIOS 
       WHERE rol_id = 3`
    );

    res.json({
      code: 200,
      data: owners
    });

  } catch (err) {
    console.error("Error al obtener lista de dueños:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Info de dueño específico
ownersRouter.get('/:ownerId', authenticateToken, checkUserOrAdmin(), async (req, res) => {
  try {
    const owner = await db.get(
      `SELECT id, nombre, email, telefono, direccion, foto 
       FROM USUARIOS 
       WHERE id = ? AND rol_id = 3`,
      [req.params.ownerId]
    );

    if (!owner) {
      return res.status(404).json({
        code: 404,
        message: "Dueño no encontrado"
      });
    }

    res.json({
      code: 200,
      data: owner
    });

  } catch (err) {
    console.error("Error al obtener información de dueño:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Mascotas por dueño
ownersRouter.get('/:ownerId/pets', authenticateToken, checkUserOrAdmin(), async (req, res) => {
  try {
    // Verificar que el dueño existe
    const ownerExists = await db.get(
      "SELECT id FROM USUARIOS WHERE id = ? AND rol_id = 3",
      [req.params.ownerId]
    );

    if (!ownerExists) {
      return res.status(404).json({
        code: 404,
        message: "Dueño no encontrado"
      });
    }

    const pets = await db.all(
      `SELECT id, nombre, especie, raza, fecha_nac, peso, foto 
       FROM MASCOTAS 
       WHERE duenho_id = ?`,
      [req.params.ownerId]
    );

    res.json({
      code: 200,
      data: pets || []
    });

  } catch (err) {
    console.error("Error al obtener mascotas del dueño:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

export default ownersRouter;