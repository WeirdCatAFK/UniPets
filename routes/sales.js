import express from 'express';
import db from './../config/db.js';

const router = express.Router();

// Crear nueva venta
router.post('/', async (req, res) => {
  const { cliente_id, productos } = req.body;

  if (!cliente_id || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ message: "Datos de venta incompletos." });
  }

  try {
    let total = 0;
    for (const item of productos) {
      const producto = await db.get("SELECT * FROM PRODUCTOS WHERE id = ?", [item.producto_id]);
      if (!producto || producto.stock < item.cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para el producto ID ${item.producto_id}` });
      }
      total += item.cantidad * producto.precio;
    }

    await db.run("BEGIN TRANSACTION");

    const ventaResult = await db.run(
      "INSERT INTO VENTAS (cliente_id, total) VALUES (?, ?)",
      [cliente_id, total]
    );
    const ventaId = ventaResult.lastID;

    for (const item of productos) {
      const producto = await db.get("SELECT * FROM PRODUCTOS WHERE id = ?", [item.producto_id]);
      const subtotal = item.cantidad * producto.precio;

      await db.run(
        "INSERT INTO DETALLE_VENTAS (venta_id, producto_id, cantidad, subtotal) VALUES (?, ?, ?, ?)",
        [ventaId, item.producto_id, item.cantidad, subtotal]
      );

      await db.run(
        "UPDATE PRODUCTOS SET stock = stock - ? WHERE id = ?",
        [item.cantidad, item.producto_id]
      );
    }

    await db.run("COMMIT");
    res.status(201).json({ message: "Venta registrada con éxito", venta_id: ventaId });

  } catch (err) {
    await db.run("ROLLBACK");
    console.error("Error al crear venta:", err);
    res.status(500).json({ message: "Error al procesar la venta." });
  }
});

// Obtener detalle de una venta
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const venta = await db.get("SELECT * FROM VENTAS WHERE id = ?", [id]);
    if (!venta) return res.status(404).json({ message: "Venta no encontrada." });

    const detalles = await db.all(
      `SELECT d.*, p.nombre, p.precio 
       FROM DETALLE_VENTAS d 
       JOIN PRODUCTOS p ON d.producto_id = p.id 
       WHERE d.venta_id = ?`,
      [id]
    );

    res.json({ ...venta, detalles });
  } catch (err) {
    console.error("Error al obtener la venta:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// Obtener ventas de un usuario
router.get('/user/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const ventas = await db.all("SELECT * FROM VENTAS WHERE cliente_id = ?", [id]);
    res.json(ventas);
  } catch (err) {
    console.error("Error al obtener ventas del usuario:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

export default router;
