import express from "express";
import db from "../config/db.js";
import { authenticateToken, checkRole, checkUserOrAdmin } from "../middleware/auth.js";

const petsRouter = express.Router();

// Registrar nueva mascota
petsRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const { nombre, especie, raza, fecha_nac, peso, foto } = req.body;
    const duenho_id = req.user.id;

    // Validación básica
    if (!nombre || !especie) {
      return res.status(400).json({
        code: 400,
        message: "Nombre y especie son campos obligatorios"
      });
    }

    // Insertar nueva mascota
    const result = await db.run(
      `INSERT INTO MASCOTAS 
       (nombre, especie, raza, fecha_nac, peso, foto, duenho_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, especie, raza || null, fecha_nac || null, peso || null, foto || null, duenho_id]
    );

    // Obtener mascota recién creada
    const nuevaMascota = await db.get(
      `SELECT id, nombre, especie, raza, fecha_nac, peso, foto 
       FROM MASCOTAS 
       WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      code: 201,
      message: "Mascota registrada exitosamente",
      data: nuevaMascota
    });

  } catch (err) {
    console.error("Error al registrar mascota:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Listar todas las mascotas (solo admin)
petsRouter.get('/', authenticateToken, checkRole(1), async (req, res) => {
  try {
    const mascotas = await db.all(
      `SELECT m.id, m.nombre, m.especie, m.raza, m.fecha_nac, m.peso, m.foto,
              u.id as duenho_id, u.nombre as duenho_nombre
       FROM MASCOTAS m
       JOIN USUARIOS u ON m.duenho_id = u.id`
    );

    res.json({
      code: 200,
      data: mascotas
    });

  } catch (err) {
    console.error("Error al listar mascotas:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Obtener detalle de mascota
petsRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const mascota = await db.get(
      `SELECT m.id, m.nombre, m.especie, m.raza, m.fecha_nac, m.peso, m.foto,
              u.id as duenho_id, u.nombre as duenho_nombre
       FROM MASCOTAS m
       JOIN USUARIOS u ON m.duenho_id = u.id
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (!mascota) {
      return res.status(404).json({
        code: 404,
        message: "Mascota no encontrada"
      });
    }

    // Verificar si el usuario es el dueño o admin
    if (req.user.rol_id !== 1 && req.user.id !== mascota.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para ver esta mascota"
      });
    }

    res.json({
      code: 200,
      data: mascota
    });

  } catch (err) {
    console.error("Error al obtener mascota:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Editar mascota
petsRouter.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { nombre, especie, raza, fecha_nac, peso, foto } = req.body;

    // Primero obtener la mascota para verificar permisos
    const mascotaExistente = await db.get(
      "SELECT duenho_id FROM MASCOTAS WHERE id = ?",
      [req.params.id]
    );

    if (!mascotaExistente) {
      return res.status(404).json({
        code: 404,
        message: "Mascota no encontrada"
      });
    }

    // Verificar permisos (dueño o admin)
    if (req.user.rol_id !== 1 && req.user.id !== mascotaExistente.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para editar esta mascota"
      });
    }

    // Actualizar mascota
    await db.run(
      `UPDATE MASCOTAS SET 
        nombre = COALESCE(?, nombre),
        especie = COALESCE(?, especie),
        raza = COALESCE(?, raza),
        fecha_nac = COALESCE(?, fecha_nac),
        peso = COALESCE(?, peso),
        foto = COALESCE(?, foto)
       WHERE id = ?`,
      [nombre, especie, raza, fecha_nac, peso, foto, req.params.id]
    );

    // Obtener mascota actualizada
    const mascotaActualizada = await db.get(
      `SELECT id, nombre, especie, raza, fecha_nac, peso, foto 
       FROM MASCOTAS 
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      code: 200,
      message: "Mascota actualizada correctamente",
      data: mascotaActualizada
    });

  } catch (err) {
    console.error("Error al actualizar mascota:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Eliminar mascota
petsRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Primero obtener la mascota para verificar permisos
    const mascota = await db.get(
      "SELECT duenho_id FROM MASCOTAS WHERE id = ?",
      [req.params.id]
    );

    if (!mascota) {
      return res.status(404).json({
        code: 404,
        message: "Mascota no encontrada"
      });
    }

    // Verificar permisos (dueño o admin)
    if (req.user.rol_id !== 1 && req.user.id !== mascota.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para eliminar esta mascota"
      });
    }

    // Eliminar mascota
    await db.run(
      "DELETE FROM MASCOTAS WHERE id = ?",
      [req.params.id]
    );

    res.json({
      code: 200,
      message: "Mascota eliminada correctamente"
    });

  } catch (err) {
    console.error("Error al eliminar mascota:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

export default petsRouter;