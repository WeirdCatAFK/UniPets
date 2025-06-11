import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Obtener datos del usuario autenticado
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await db.get(
      "SELECT id, nombre, email, rol_id, telefono, direccion FROM USUARIOS WHERE id = ?", 
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.json(user);
    
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Actualizar datos del usuario (ejemplo con PUT)
router.put('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, email } = req.body;

    // Validación básica
    if (!nombre || !email) {
      return res.status(400).json({ message: "Nombre y email son requeridos" });
    }

    // Verificar si el email ya existe en otro usuario
    const existingUser = await db.get(
      "SELECT id FROM USUARIOS WHERE email = ? AND id != ?",
      [email, userId]
    );
    
    if (existingUser) {
      return res.status(409).json({ message: "El email ya está en uso por otro usuario" });
    }

    // Actualizar usuario
    await db.run(
      "UPDATE USUARIOS SET nombre = ?, email = ? WHERE id = ?",
      [nombre, email, userId]
    );

    // Devolver usuario actualizado
    const updatedUser = await db.get(
      "SELECT id, nombre, email, rol_id FROM USUARIOS WHERE id = ?",
      [userId]
    );

    res.json(updatedUser);
    
  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;