import express from 'express';
import db from './../config/db.js';

const router = express.Router();

// Obtener catálogo de productos
router.get('/', async (req, res) => {
  try {
    const products = await db.all("SELECT * FROM PRODUCTOS");
    res.json(products);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// Obtener detalle de producto por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await db.get("SELECT * FROM PRODUCTOS WHERE id = ?", [id]);
    if (!product) return res.status(404).json({ message: "Producto no encontrado." });

    res.json(product);
  } catch (err) {
    console.error("Error al obtener el producto:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

export default router;
