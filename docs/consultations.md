## Endpoints


## Base URL

`{api_url}:50500/consultations`

### 1. Registrar nueva consulta

**URL**: `/`
**Método**: `POST`
**Autenticación requerida**: Sí
**Permisos requeridos**: Veterinario (rol_id = 2)

#### Campos requeridos en el body:

| Campo      | Tipo   | Descripción              |
| ---------- | ------ | ------------------------- |
| mascota_id | number | ID de la mascota atendida |
| motivo     | string | Razón de la consulta     |

#### Campos opcionales:

| Campo       | Tipo   | Descripción            |
| ----------- | ------ | ----------------------- |
| diagnostico | string | Diagnóstico médico    |
| tratamiento | string | Tratamiento recomendado |

#### Ejemplo de request:

```json
{
  "mascota_id": 5,
  "motivo": "Control anual",
  "diagnostico": "Salud óptima",
  "tratamiento": "Vacunación anual recomendada"
}
```

#### Respuestas posibles:

- **201 Created**: Consulta registrada con éxito
- **400 Bad Request**: Faltan campos obligatorios
- **404 Not Found**: Mascota no encontrada
- **500 Internal Server Error**: Error del servidor

---

### 2. Historial de consultas de una mascota

**URL**: `/pets/:id/consultations`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Dueño de la mascota, veterinario o admin

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": [
    {
      "id": 12,
      "fecha": "2023-05-10 14:30:00",
      "motivo": "Control anual",
      "diagnostico": "Salud óptima",
      "tratamiento": "Vacunación anual",
      "veterinario_id": 8,
      "veterinario_nombre": "Dr. Rodríguez"
    }
  ]
}
```

---

### 3. Detalles de una consulta específica

**URL**: `/{id}`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Dueño de la mascota, veterinario asignado o admin

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": {
    "id": 12,
    "mascota_id": 5,
    "fecha": "2023-05-10 14:30:00",
    "motivo": "Control anual",
    "diagnostico": "Salud óptima",
    "tratamiento": "Vacunación anual recomendada",
    "mascota_nombre": "Firulais",
    "especie": "Perro",
    "raza": "Labrador",
    "veterinario_id": 8,
    "veterinario_nombre": "Dr. Rodríguez"
  }
}
```

---

### 4. Editar consulta

**URL**: `/{id}`
**Método**: `PUT`
**Autenticación requerida**: Sí
**Permisos requeridos**: Veterinario asignado o admin

#### Campos editables (todos opcionales):

| Campo       | Tipo   | Descripción            |
| ----------- | ------ | ----------------------- |
| motivo      | string | Razón de la consulta   |
| diagnostico | string | Diagnóstico médico    |
| tratamiento | string | Tratamiento recomendado |

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "message": "Consulta actualizada correctamente",
  "data": {
    "id": 12,
    "mascota_id": 5,
    "fecha": "2023-05-10 14:30:00",
    "motivo": "Control anual y vacunación",
    "diagnostico": "Salud óptima",
    "tratamiento": "Vacunación anual aplicada",
    "mascota_nombre": "Firulais",
    "veterinario_nombre": "Dr. Rodríguez"
  }
}
```

---

### 5. Eliminar consulta

**URL**: `/{id}`
**Método**: `DELETE`
**Autenticación requerida**: Sí
**Permisos requeridos**: Administrador (rol_id = 1)

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "message": "Consulta y archivos asociados eliminados correctamente"
}
```

---

### 6. Subir archivo a consulta

**URL**: `/{id}/files`
**Método**: `POST`
**Autenticación requerida**: Sí
**Permisos requeridos**: Veterinario asignado o admin

#### FormData requerido:

| Campo   | Tipo   | Descripción               |
| ------- | ------ | -------------------------- |
| archivo | file   | Archivo a subir            |
| tipo    | string | Tipo de archivo (opcional) |

#### Respuesta exitosa (201 Created):

```json
{
  "code": 201,
  "message": "Archivo subido correctamente",
  "data": {
    "nombre_original": "radiografia.jpg",
    "nombre_archivo": "1234567890-radiografia.jpg",
    "tipo": "imagen",
    "tamaño": 245678
  }
}
```

---

### 7. Ver archivos de una consulta

**URL**: `/{id}/files`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Dueño de la mascota, veterinario asignado o admin

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": [
    {
      "id": 3,
      "ruta_archivo": "1234567890-radiografia.jpg",
      "tipo": "imagen",
      "url": "/api/consultations/files/1234567890-radiografia.jpg"
    }
  ]
}
```

---

## Consideraciones adicionales

1. **Seguridad**:

   - Validación estricta de permisos en cada operación
   - Los archivos se almacenan con nombres únicos
   - Límite de tamaño de archivos (10MB)
2. **Relaciones**:

   - Cada consulta crea automáticamente una cita marcada como "Completada"
   - Integridad referencial con mascotas y usuarios
3. **Estructura**:

   - Respuestas estandarizadas con códigos HTTP apropiados
   - Manejo completo de errores
4. **Servicio de archivos**:

   - Necesitarás configurar una ruta adicional para servir los archivos estáticos
   - Los archivos se guardan en `./data/consultation_files/`
