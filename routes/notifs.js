import express from "express";
import db from "../config/db.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const notifsRouter = express.Router();

// Enviar notificación (admin o sistema)
notifsRouter.post('/', authenticateToken, checkRole([1]), async (req, res) => {
  try {
    const { usuario_id, mensaje } = req.body;

    // Validación básica
    if (!usuario_id || !mensaje) {
      return res.status(400).json({
        code: 400,
        message: "usuario_id y mensaje son campos obligatorios"
      });
    }

    // Verificar que el usuario existe
    const usuario = await db.get("SELECT id FROM USUARIOS WHERE id = ?", [usuario_id]);
    if (!usuario) {
      return res.status(404).json({
        code: 404,
        message: "Usuario no encontrado"
      });
    }

    // Insertar nueva notificación
    const result = await db.run(
      `INSERT INTO NOTIFICACIONES 
       (usuario_id, mensaje) 
       VALUES (?, ?)`,
      [usuario_id, mensaje]
    );

    // Obtener notificación recién creada
    const nuevaNotificacion = await db.get(
      `SELECT id, usuario_id, mensaje, fecha, leida 
       FROM NOTIFICACIONES 
       WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      code: 201,
      message: "Notificación enviada exitosamente",
      data: nuevaNotificacion
    });

  } catch (err) {
    console.error("Error al enviar notificación:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Obtener notificaciones del usuario autenticado
notifsRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener notificaciones ordenadas por fecha (más recientes primero)
    const notificaciones = await db.all(
      `SELECT id, mensaje, fecha, leida 
       FROM NOTIFICACIONES 
       WHERE usuario_id = ?
       ORDER BY fecha DESC`,
      [userId]
    );

    res.json({
      code: 200,
      data: notificaciones
    });

  } catch (err) {
    console.error("Error al obtener notificaciones:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Marcar notificación como leída
notifsRouter.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificacionId = req.params.id;
    const userId = req.user.id;

    // Verificar que la notificación existe y pertenece al usuario
    const notificacion = await db.get(
      "SELECT id FROM NOTIFICACIONES WHERE id = ? AND usuario_id = ?",
      [notificacionId, userId]
    );

    if (!notificacion) {
      return res.status(404).json({
        code: 404,
        message: "Notificación no encontrada o no tienes permisos"
      });
    }

    // Marcar como leída
    await db.run(
      "UPDATE NOTIFICACIONES SET leida = 1 WHERE id = ?",
      [notificacionId]
    );

    res.json({
      code: 200,
      message: "Notificación marcada como leída"
    });

  } catch (err) {
    console.error("Error al marcar notificación como leída:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

export default notifsRouter;