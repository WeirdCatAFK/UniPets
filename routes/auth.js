import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './../config/db.js';
const auth = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const SALT_ROUNDS = 10;

// Registro
auth.post('/register', async (req, res) => {
  const { nombre, email, password, rol_id } = req.body;

  if (!email || !password || !nombre || !rol_id) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }

  try {
    const existingUser = await db.get("SELECT * FROM USUARIOS WHERE email = ?", [email]);
    if (existingUser) return res.status(409).json({ message: "El email ya está registrado." });

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
auth.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.get("SELECT * FROM USUARIOS WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ message: "Credenciales inválidas." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Credenciales inválidas." });

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol_id: user.rol_id },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

export default auth;
