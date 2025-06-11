import express from "express";
import db from "../config/db.js";
import multer from "multer";
import path from "path";
import { authenticateToken, checkRole } from "../middleware/auth.js";
import { fileURLToPath } from 'url';

const consultationsRouter = express.Router();

// Configuración de Multer para subir archivos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../data/consultation_files'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB límite
});

// Registrar nueva consulta
consultationsRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const { mascota_id, motivo, diagnostico, tratamiento } = req.body;
    const veterinario_id = req.user.id;

    // Validación básica
    if (!mascota_id || !motivo) {
      return res.status(400).json({
        code: 400,
        message: "mascota_id y motivo son campos obligatorios"
      });
    }

    // Verificar que la mascota existe
    const mascota = await db.get("SELECT id FROM MASCOTAS WHERE id = ?", [mascota_id]);
    if (!mascota) {
      return res.status(404).json({
        code: 404,
        message: "Mascota no encontrada"
      });
    }

    // Insertar nueva consulta
    const result = await db.run(
      `INSERT INTO CONSULTAS 
       (mascota_id, motivo, diagnostico, tratamiento) 
       VALUES (?, ?, ?, ?)`,
      [mascota_id, motivo, diagnostico || null, tratamiento || null]
    );

    // Registrar cita asociada
    await db.run(
      `INSERT INTO CITAS
       (mascota_id, veterinario_id, fecha_hora, estado)
       VALUES (?, ?, datetime('now'), 'Completada')`,
      [mascota_id, veterinario_id]
    );

    // Obtener consulta recién creada
    const nuevaConsulta = await db.get(
      `SELECT c.id, c.mascota_id, c.fecha, c.motivo, c.diagnostico, c.tratamiento,
              m.nombre as mascota_nombre
       FROM CONSULTAS c
       JOIN MASCOTAS m ON c.mascota_id = m.id
       WHERE c.id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      code: 201,
      message: "Consulta registrada exitosamente",
      data: nuevaConsulta
    });

  } catch (err) {
    console.error("Error al registrar consulta:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Historial de consultas de una mascota
consultationsRouter.get('/pets/:id/consultations', authenticateToken, async (req, res) => {
  try {
    // Verificar permisos (dueño o veterinario/admin)
    const mascota = await db.get(
      `SELECT m.id, m.duenho_id, u.rol_id
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

    if (req.user.rol_id !== 1 && req.user.rol_id !== 2 && req.user.id !== mascota.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para ver estas consultas"
      });
    }

    const consultas = await db.all(
      `SELECT c.id, c.fecha, c.motivo, c.diagnostico, c.tratamiento,
              u.id as veterinario_id, u.nombre as veterinario_nombre
       FROM CONSULTAS c
       JOIN CITAS ct ON c.mascota_id = ct.mascota_id AND strftime('%Y-%m-%d %H:%M', c.fecha) = strftime('%Y-%m-%d %H:%M', ct.fecha_hora)
       JOIN USUARIOS u ON ct.veterinario_id = u.id
       WHERE c.mascota_id = ?
       ORDER BY c.fecha DESC`,
      [req.params.id]
    );

    res.json({
      code: 200,
      data: consultas
    });

  } catch (err) {
    console.error("Error al obtener consultas:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Detalles de una consulta
consultationsRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const consulta = await db.get(
      `SELECT c.id, c.mascota_id, c.fecha, c.motivo, c.diagnostico, c.tratamiento,
              m.nombre as mascota_nombre, m.especie, m.raza,
              u.id as veterinario_id, u.nombre as veterinario_nombre
       FROM CONSULTAS c
       JOIN MASCOTAS m ON c.mascota_id = m.id
       JOIN CITAS ct ON c.mascota_id = ct.mascota_id AND strftime('%Y-%m-%d %H:%M', c.fecha) = strftime('%Y-%m-%d %H:%M', ct.fecha_hora)
       JOIN USUARIOS u ON ct.veterinario_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!consulta) {
      return res.status(404).json({
        code: 404,
        message: "Consulta no encontrada"
      });
    }

    // Verificar permisos (dueño, veterinario asignado o admin)
    const mascota = await db.get("SELECT duenho_id FROM MASCOTAS WHERE id = ?", [consulta.mascota_id]);
    if (req.user.rol_id !== 1 && req.user.rol_id !== 2 && req.user.id !== mascota.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para ver esta consulta"
      });
    }

    res.json({
      code: 200,
      data: consulta
    });

  } catch (err) {
    console.error("Error al obtener consulta:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Editar consulta (solo veterinario asignado o admin)
consultationsRouter.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { motivo, diagnostico, tratamiento } = req.body;

    // Primero obtener la consulta para verificar permisos
    const consulta = await db.get(
      `SELECT c.id, c.mascota_id, ct.veterinario_id
       FROM CONSULTAS c
       JOIN CITAS ct ON c.mascota_id = ct.mascota_id AND strftime('%Y-%m-%d %H:%M', c.fecha) = strftime('%Y-%m-%d %H:%M', ct.fecha_hora)
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!consulta) {
      return res.status(404).json({
        code: 404,
        message: "Consulta no encontrada"
      });
    }

    // Verificar permisos (veterinario asignado o admin)
    if (req.user.rol_id !== 1 && req.user.id !== consulta.veterinario_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para editar esta consulta"
      });
    }

    // Actualizar consulta
    await db.run(
      `UPDATE CONSULTAS SET 
        motivo = COALESCE(?, motivo),
        diagnostico = COALESCE(?, diagnostico),
        tratamiento = COALESCE(?, tratamiento)
       WHERE id = ?`,
      [motivo, diagnostico, tratamiento, req.params.id]
    );

    // Obtener consulta actualizada
    const consultaActualizada = await db.get(
      `SELECT c.id, c.mascota_id, c.fecha, c.motivo, c.diagnostico, c.tratamiento,
              m.nombre as mascota_nombre,
              u.nombre as veterinario_nombre
       FROM CONSULTAS c
       JOIN MASCOTAS m ON c.mascota_id = m.id
       JOIN CITAS ct ON c.mascota_id = ct.mascota_id AND strftime('%Y-%m-%d %H:%M', c.fecha) = strftime('%Y-%m-%d %H:%M', ct.fecha_hora)
       JOIN USUARIOS u ON ct.veterinario_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    res.json({
      code: 200,
      message: "Consulta actualizada correctamente",
      data: consultaActualizada
    });

  } catch (err) {
    console.error("Error al actualizar consulta:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Eliminar consulta (solo admin)
consultationsRouter.delete('/:id', authenticateToken, checkRole(1), async (req, res) => {
  try {
    // Verificar que la consulta existe
    const consulta = await db.get("SELECT id FROM CONSULTAS WHERE id = ?", [req.params.id]);
    if (!consulta) {
      return res.status(404).json({
        code: 404,
        message: "Consulta no encontrada"
      });
    }

    // Eliminar archivos asociados primero
    const archivos = await db.all("SELECT ruta_archivo FROM ARCHIVOS WHERE consulta_id = ?", [req.params.id]);
    
    // Aquí podrías implementar la eliminación física de los archivos si es necesario
    // fs.unlinkSync(path.join(__dirname, '../data/consultation_files', archivo.ruta_archivo));

    await db.run("DELETE FROM ARCHIVOS WHERE consulta_id = ?", [req.params.id]);
    
    // Eliminar consulta
    await db.run("DELETE FROM CONSULTAS WHERE id = ?", [req.params.id]);

    res.json({
      code: 200,
      message: "Consulta y archivos asociados eliminados correctamente"
    });

  } catch (err) {
    console.error("Error al eliminar consulta:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Subir archivo a consulta
consultationsRouter.post('/:id/files', authenticateToken, upload.single('archivo'), async (req, res) => {
  try {
    const consulta_id = req.params.id;
    const { tipo } = req.body;
    const ruta_archivo = req.file.filename;

    // Verificar que la consulta existe y tiene permisos
    const consulta = await db.get(
      `SELECT c.id, ct.veterinario_id
       FROM CONSULTAS c
       JOIN CITAS ct ON c.mascota_id = ct.mascota_id AND strftime('%Y-%m-%d %H:%M', c.fecha) = strftime('%Y-%m-%d %H:%M', ct.fecha_hora)
       WHERE c.id = ?`,
      [consulta_id]
    );

    if (!consulta) {
      return res.status(404).json({
        code: 404,
        message: "Consulta no encontrada"
      });
    }

    // Verificar permisos (veterinario asignado o admin)
    if (req.user.rol_id !== 1 && req.user.id !== consulta.veterinario_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para agregar archivos a esta consulta"
      });
    }

    // Registrar archivo en la base de datos
    await db.run(
      `INSERT INTO ARCHIVOS 
       (consulta_id, ruta_archivo, tipo) 
       VALUES (?, ?, ?)`,
      [consulta_id, ruta_archivo, tipo || 'documento']
    );

    res.status(201).json({
      code: 201,
      message: "Archivo subido correctamente",
      data: {
        nombre_original: req.file.originalname,
        nombre_archivo: ruta_archivo,
        tipo: tipo || 'documento',
        tamaño: req.file.size
      }
    });

  } catch (err) {
    console.error("Error al subir archivo:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Ver archivos de una consulta
consultationsRouter.get('/:id/files', authenticateToken, async (req, res) => {
  try {
    const consulta_id = req.params.id;

    // Verificar que la consulta existe y tiene permisos
    const consulta = await db.get(
      `SELECT c.id, c.mascota_id, ct.veterinario_id
       FROM CONSULTAS c
       JOIN CITAS ct ON c.mascota_id = ct.mascota_id AND strftime('%Y-%m-%d %H:%M', c.fecha) = strftime('%Y-%m-%d %H:%M', ct.fecha_hora)
       WHERE c.id = ?`,
      [consulta_id]
    );

    if (!consulta) {
      return res.status(404).json({
        code: 404,
        message: "Consulta no encontrada"
      });
    }

    // Verificar permisos (dueño, veterinario asignado o admin)
    const mascota = await db.get("SELECT duenho_id FROM MASCOTAS WHERE id = ?", [consulta.mascota_id]);
    if (req.user.rol_id !== 1 && req.user.rol_id !== 2 && req.user.id !== mascota.duenho_id) {
      return res.status(403).json({
        code: 403,
        message: "No tienes permiso para ver estos archivos"
      });
    }

    const archivos = await db.all(
      "SELECT id, ruta_archivo, tipo FROM ARCHIVOS WHERE consulta_id = ?",
      [consulta_id]
    );

    res.json({
      code: 200,
      data: archivos.map(archivo => ({
        ...archivo,
        url: `/api/consultations/files/${archivo.ruta_archivo}`
      }))
    });

  } catch (err) {
    console.error("Error al obtener archivos:", err);
    res.status(500).json({
      code: 500,
      message: "Error interno del servidor"
    });
  }
});

// Servir archivos (añade esto a tu main.js o donde configures las rutas)
/*
app.get('/api/consultations/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'data/consultation_files', req.params.filename);
  res.sendFile(filePath);
});
*/

export default consultationsRouter;