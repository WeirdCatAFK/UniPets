import express from "express";
import db from "../config/db.js";
import { authenticateToken, checkRole, checkUserOrAdmin } from "../middleware/auth.js";

const appointmentsRouter = express.Router();

// Crear nueva cita
appointmentsRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const { mascota_id, veterinario_id, fecha_hora } = req.body;
    const userId = req.user.id;

    // Validación básica
    if (!mascota_id || !veterinario_id || !fecha_hora) {
      return res.status(400).json({
        code: 400,
        message: "mascota_id, veterinario_id y fecha_hora son campos obligatorios"
      });
    }

    // Verificar que la mascota existe y pertenece al usuario (si es cliente)
    const mascota = await db.get(
      "SELECT id, duenho_id FROM MASCOTAS WHERE id = ?", 
      [mascota_id]
    );
    
    if (!mascota) {
      return res.status(404).json({
        code: 404,
        message: "Mascota no encontrada"
      });
    }

    // Si es cliente, verificar que es dueño de la mascota
    if (req.user.rol_id === 3 && req.user.id !== mascota.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para agendar citas para esta mascota"
      });
    }

    // Verificar que el veterinario existe y tiene el rol correcto
    const veterinario = await db.get(
      "SELECT id, rol_id FROM USUARIOS WHERE id = ?",
      [veterinario_id]
    );
    
    if (!veterinario || veterinario.rol_id !== 2) {
      return res.status(400).json({
        code: 400,
        message: "El veterinario especificado no existe o no tiene el rol correcto"
      });
    }

    // Verificar disponibilidad del veterinario
    const citaExistente = await db.get(
      `SELECT id FROM CITAS 
       WHERE veterinario_id = ? 
       AND fecha_hora = ? 
       AND estado != 'Cancelada'`,
      [veterinario_id, fecha_hora]
    );
    
    if (citaExistente) {
      return res.status(409).json({
        code: 409,
        message: "El veterinario ya tiene una cita programada en ese horario"
      });
    }

    // Insertar nueva cita
    const result = await db.run(
      `INSERT INTO CITAS 
       (mascota_id, veterinario_id, fecha_hora) 
       VALUES (?, ?, ?)`,
      [mascota_id, veterinario_id, fecha_hora]
    );

    // Obtener cita recién creada
    const nuevaCita = await db.get(
      `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
              m.nombre as mascota_nombre,
              u.nombre as veterinario_nombre
       FROM CITAS c
       JOIN MASCOTAS m ON c.mascota_id = m.id
       JOIN USUARIOS u ON c.veterinario_id = u.id
       WHERE c.id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      code: 201,
      message: "Cita programada exitosamente",
      data: nuevaCita
    });

  } catch (err) {
    console.error("Error al programar cita:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Listar citas (según rol)
appointmentsRouter.get('/', authenticateToken, async (req, res) => {
  try {
    let citas;
    
    // Admin ve todas las citas
    if (req.user.rol_id === 1) {
      citas = await db.all(
        `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
                m.nombre as mascota_nombre,
                u.nombre as veterinario_nombre,
                u2.nombre as duenho_nombre
         FROM CITAS c
         JOIN MASCOTAS m ON c.mascota_id = m.id
         JOIN USUARIOS u ON c.veterinario_id = u.id
         JOIN USUARIOS u2 ON m.duenho_id = u2.id
         ORDER BY c.fecha_hora DESC`
      );
    } 
    // Veterinario ve sus citas
    else if (req.user.rol_id === 2) {
      citas = await db.all(
        `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
                m.nombre as mascota_nombre,
                u.nombre as veterinario_nombre,
                u2.nombre as duenho_nombre
         FROM CITAS c
         JOIN MASCOTAS m ON c.mascota_id = m.id
         JOIN USUARIOS u ON c.veterinario_id = u.id
         JOIN USUARIOS u2 ON m.duenho_id = u2.id
         WHERE c.veterinario_id = ?
         ORDER BY c.fecha_hora DESC`,
        [req.user.id]
      );
    } 
    // Cliente ve citas de sus mascotas
    else if (req.user.rol_id === 3) {
      citas = await db.all(
        `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
                m.nombre as mascota_nombre,
                u.nombre as veterinario_nombre
         FROM CITAS c
         JOIN MASCOTAS m ON c.mascota_id = m.id
         JOIN USUARIOS u ON c.veterinario_id = u.id
         WHERE m.duenho_id = ?
         ORDER BY c.fecha_hora DESC`,
        [req.user.id]
      );
    }

    res.json({
      code: 200,
      data: citas
    });

  } catch (err) {
    console.error("Error al obtener citas:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Detalle de cita específica
appointmentsRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const cita = await db.get(
      `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
              m.nombre as mascota_nombre, m.especie, m.raza,
              u.nombre as veterinario_nombre,
              u2.id as duenho_id, u2.nombre as duenho_nombre
       FROM CITAS c
       JOIN MASCOTAS m ON c.mascota_id = m.id
       JOIN USUARIOS u ON c.veterinario_id = u.id
       JOIN USUARIOS u2 ON m.duenho_id = u2.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!cita) {
      return res.status(404).json({
        code: 404,
        message: "Cita no encontrada"
      });
    }

    // Verificar permisos (dueño, veterinario asignado o admin)
    if (req.user.rol_id !== 1 && req.user.id !== cita.veterinario_id && req.user.id !== cita.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para ver esta cita"
      });
    }

    res.json({
      code: 200,
      data: cita
    });

  } catch (err) {
    console.error("Error al obtener cita:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Modificar cita
appointmentsRouter.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { mascota_id, veterinario_id, fecha_hora, estado } = req.body;

    // Primero obtener la cita para verificar permisos
    const citaExistente = await db.get(
      `SELECT c.id, c.veterinario_id, m.duenho_id
       FROM CITAS c
       JOIN MASCOTAS m ON c.mascota_id = m.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!citaExistente) {
      return res.status(404).json({
        code: 404,
        message: "Cita no encontrada"
      });
    }

    // Verificar permisos (dueño, veterinario asignado o admin)
    if (req.user.rol_id !== 1 && 
        req.user.id !== citaExistente.veterinario_id && 
        req.user.id !== citaExistente.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para modificar esta cita"
      });
    }

    // Solo admin puede cambiar el estado a "Completada"
    if (estado === 'Completada' && req.user.rol_id !== 1) {
      return res.status(403).json({
        code: 403,
        message: "Solo administradores pueden marcar citas como completadas"
      });
    }

    // Verificar disponibilidad si se cambia fecha/veterinario
    if (fecha_hora || veterinario_id) {
      const vetId = veterinario_id || citaExistente.veterinario_id;
      const fecha = fecha_hora || citaExistente.fecha_hora;

      const conflicto = await db.get(
        `SELECT id FROM CITAS 
         WHERE veterinario_id = ? 
         AND fecha_hora = ? 
         AND estado != 'Cancelada'
         AND id != ?`,
        [vetId, fecha, req.params.id]
      );
      
      if (conflicto) {
        return res.status(409).json({
          code: 409,
          message: "El veterinario ya tiene una cita programada en ese horario"
        });
      }
    }

    // Actualizar cita
    await db.run(
      `UPDATE CITAS SET 
        mascota_id = COALESCE(?, mascota_id),
        veterinario_id = COALESCE(?, veterinario_id),
        fecha_hora = COALESCE(?, fecha_hora),
        estado = COALESCE(?, estado)
       WHERE id = ?`,
      [mascota_id, veterinario_id, fecha_hora, estado, req.params.id]
    );

    // Obtener cita actualizada
    const citaActualizada = await db.get(
      `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
              m.nombre as mascota_nombre,
              u.nombre as veterinario_nombre
       FROM CITAS c
       JOIN MASCOTAS m ON c.mascota_id = m.id
       JOIN USUARIOS u ON c.veterinario_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    res.json({
      code: 200,
      message: "Cita actualizada correctamente",
      data: citaActualizada
    });

  } catch (err) {
    console.error("Error al actualizar cita:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Cancelar cita
appointmentsRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Primero obtener la cita para verificar permisos
    const cita = await db.get(
      `SELECT c.id, c.veterinario_id, m.duenho_id
       FROM CITAS c
       JOIN MASCOTAS m ON c.mascota_id = m.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!cita) {
      return res.status(404).json({
        code: 404,
        message: "Cita no encontrada"
      });
    }

    // Verificar permisos (dueño, veterinario asignado o admin)
    if (req.user.rol_id !== 1 && 
        req.user.id !== cita.veterinario_id && 
        req.user.id !== cita.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para cancelar esta cita"
      });
    }

    // Marcar como cancelada en lugar de eliminar
    await db.run(
      "UPDATE CITAS SET estado = 'Cancelada' WHERE id = ?",
      [req.params.id]
    );

    res.json({
      code: 200,
      message: "Cita cancelada correctamente"
    });

  } catch (err) {
    console.error("Error al cancelar cita:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Citas por usuario
appointmentsRouter.get('/users/:id/appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Verificar permisos (admin, mismo usuario o veterinario)
    if (req.user.rol_id !== 1 && req.user.id !== parseInt(userId)) {
      const esVeterinario = await db.get(
        "SELECT id FROM USUARIOS WHERE id = ? AND rol_id = 2",
        [req.user.id]
      );
      
      if (!esVeterinario) {
        return res.status(403).json({
          code: 403,
          message: "No tienes permiso para ver estas citas"
        });
      }
    }

    // Determinar qué citas mostrar según rol del usuario consultado
    const usuario = await db.get(
      "SELECT id, rol_id FROM USUARIOS WHERE id = ?",
      [userId]
    );

    if (!usuario) {
      return res.status(404).json({
        code: 404,
        message: "Usuario no encontrado"
      });
    }

    let citas;
    
    if (usuario.rol_id === 2) { // Veterinario
      citas = await db.all(
        `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
                m.nombre as mascota_nombre,
                u.nombre as duenho_nombre
         FROM CITAS c
         JOIN MASCOTAS m ON c.mascota_id = m.id
         JOIN USUARIOS u ON m.duenho_id = u.id
         WHERE c.veterinario_id = ?
         ORDER BY c.fecha_hora DESC`,
        [userId]
      );
    } else { // Cliente o admin
      citas = await db.all(
        `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
                m.nombre as mascota_nombre,
                u.nombre as veterinario_nombre
         FROM CITAS c
         JOIN MASCOTAS m ON c.mascota_id = m.id
         JOIN USUARIOS u ON c.veterinario_id = u.id
         WHERE m.duenho_id = ?
         ORDER BY c.fecha_hora DESC`,
        [userId]
      );
    }

    res.json({
      code: 200,
      data: citas
    });

  } catch (err) {
    console.error("Error al obtener citas por usuario:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Citas por mascota
appointmentsRouter.get('/pets/:id/appointments', authenticateToken, async (req, res) => {
  try {
    const mascotaId = req.params.id;

    // Verificar que la mascota existe
    const mascota = await db.get(
      "SELECT id, duenho_id FROM MASCOTAS WHERE id = ?",
      [mascotaId]
    );

    if (!mascota) {
      return res.status(404).json({
        code: 404,
        message: "Mascota no encontrada"
      });
    }

    // Verificar permisos (dueño, veterinario o admin)
    if (req.user.rol_id !== 1 && req.user.rol_id !== 2 && req.user.id !== mascota.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para ver estas citas"
      });
    }

    const citas = await db.all(
      `SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora, c.estado,
              u.nombre as veterinario_nombre
       FROM CITAS c
       JOIN USUARIOS u ON c.veterinario_id = u.id
       WHERE c.mascota_id = ?
       ORDER BY c.fecha_hora DESC`,
      [mascotaId]
    );

    res.json({
      code: 200,
      data: citas
    });

  } catch (err) {
    console.error("Error al obtener citas por mascota:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

export default appointmentsRouter;