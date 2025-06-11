import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./../config/db.js";
const auth = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const SALT_ROUNDS = 10;

// Registro
auth.post("/register", async (req, res) => {
  const { nombre, email, password, rol_id } = req.body;

  if (!email || !password || !nombre || !rol_id) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios." });
  }

  try {
    const existingUser = await db.get(
      "SELECT * FROM USUARIOS WHERE email = ?",
      [email]
    );
    if (existingUser)
      return res.status(409).json({ message: "El email ya está registrado." });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await db.run(
      "INSERT INTO USUARIOS (nombre, email, password, rol_id) VALUES (?, ?, ?, ?)",
      [nombre, email, hashedPassword, rol_id]
    );

    res.status(201).json({ message: "Usuario registrado con éxito." });
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// Login
auth.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.get("SELECT * FROM USUARIOS WHERE email = ?", [
      email,
    ]);
    if (!user)
      return res.status(401).json({ message: "Credenciales inválidas." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Credenciales inválidas." });

    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol_id: user.rol_id,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// Recuperación de contraseña - solicitar token
auth.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "El email es obligatorio." });

  try {
    const user = await db.get("SELECT * FROM USUARIOS WHERE email = ?", [
      email,
    ]);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado." });

    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "15m",
    });

    // Simulación de envío por correo (en producción enviar email)
    res.status(200).json({
      message: "Token de recuperación generado.",
      resetToken,
    });
  } catch (err) {
    console.error("Error generando token de recuperación:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// Cambiar la contraseña usando token
auth.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token y nueva contraseña son obligatorios." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.run("UPDATE USUARIOS SET password = ? WHERE id = ?", [
      hashedPassword,
      payload.id,
    ]);

    res.status(200).json({ message: "Contraseña actualizada exitosamente." });
  } catch (err) {
    console.error("Error en recuperación:", err);
    res.status(400).json({ message: "Token inválido o expirado." });
  }
});

export default auth;
