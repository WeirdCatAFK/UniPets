CREATE TABLE IF NOT EXISTS ROLES (
  id integer PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS USUARIOS (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  telefono text,
  direccion text,
  foto text,
  rol_id integer NOT NULL REFERENCES ROLES(id)
);

CREATE INDEX idx_usuario_rol ON USUARIOS (rol_id);

CREATE TABLE IF NOT EXISTS MASCOTAS (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  especie text NOT NULL,
  raza text,
  fecha_nac date,
  peso real,
  foto text,
  duenho_id integer NOT NULL REFERENCES USUARIOS(id)
);

CREATE INDEX idx_mascota_duenho ON MASCOTAS (duenho_id);

CREATE TABLE IF NOT EXISTS VACUNAS (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text
);

CREATE TABLE IF NOT EXISTS PRODUCTOS (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  precio real NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  categoria text NOT NULL
);

CREATE TABLE IF NOT EXISTS VENTAS (
  id integer PRIMARY KEY,
  cliente_id integer REFERENCES USUARIOS(id),
  fecha datetime DEFAULT CURRENT_TIMESTAMP,
  total real NOT NULL
);

CREATE INDEX idx_venta_cliente ON VENTAS (cliente_id);

CREATE TABLE IF NOT EXISTS DETALLE_VENTAS (
  id integer PRIMARY KEY,
  venta_id integer NOT NULL REFERENCES VENTAS(id),
  producto_id integer NOT NULL REFERENCES PRODUCTOS(id),
  cantidad integer NOT NULL,
  subtotal real NOT NULL
);

CREATE TABLE IF NOT EXISTS NOTIFICACIONES (
  id integer PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES USUARIOS(id),
  mensaje text NOT NULL,
  fecha datetime DEFAULT CURRENT_TIMESTAMP,
  leida boolean DEFAULT 0
);

CREATE TABLE IF NOT EXISTS CONSULTAS (
  id integer PRIMARY KEY,
  mascota_id integer NOT NULL REFERENCES MASCOTAS(id),
  fecha datetime DEFAULT CURRENT_TIMESTAMP,
  motivo text NOT NULL,
  diagnostico text,
  tratamiento text
);

CREATE TABLE IF NOT EXISTS MASCOTA_VACUNA (
  id integer PRIMARY KEY,
  mascota_id integer NOT NULL REFERENCES MASCOTAS(id),
  vacuna_id integer NOT NULL REFERENCES VACUNAS(id),
  fecha_aplicacion date NOT NULL,
  proxima_dosis date
);

CREATE TABLE IF NOT EXISTS CITAS (
  id integer PRIMARY KEY,
  mascota_id integer NOT NULL REFERENCES MASCOTAS(id),
  veterinario_id integer NOT NULL REFERENCES USUARIOS(id),
  fecha_hora datetime NOT NULL,
  estado text DEFAULT 'Programada'
);

CREATE INDEX idx_cita_veterinario ON CITAS (veterinario_id);

CREATE TABLE IF NOT EXISTS ARCHIVOS (
  id integer PRIMARY KEY,
  consulta_id integer NOT NULL REFERENCES CONSULTAS(id),
  ruta_archivo text NOT NULL,
  tipo text
);

-- Insertar roles
INSERT INTO ROLES (nombre) VALUES ('Admin'), ('Vet'), ('Owner');

-- Insertar usuarios por defecto
INSERT INTO USUARIOS (nombre, email, password, rol_id) VALUES
('Admin Principal', 'admin@unipets.com', 'admin123', 1),
('Vet Sandra', 'vet@unipets.com', 'vet123', 2),
('Cliente Juan', 'cliente@unipets.com', 'cliente123', 3);