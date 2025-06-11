# Descripción

Este documento describe los endpoints disponibles para el manejo de mascotas en el sistema UniPets.

## Base URL

`{api_url}:50500/api/pets`

## Endpoints

### 1. Registrar nueva mascota

**URL**: `/`
**Método**: `POST`
**Autenticación requerida**: Sí
**Permisos requeridos**: Dueño de mascota (rol_id = 3)

#### Campos requeridos en el body:

| Campo   | Tipo   | Descripción               |
| ------- | ------ | -------------------------- |
| nombre  | string | Nombre de la mascota       |
| especie | string | Especie (perro, gato, etc) |

#### Campos opcionales:

| Campo     | Tipo   | Descripción                     |
| --------- | ------ | -------------------------------- |
| raza      | string | Raza de la mascota               |
| fecha_nac | date   | Fecha de nacimiento (YYYY-MM-DD) |
| peso      | number | Peso en kg                       |
| foto      | string | URL de la foto                   |

#### Ejemplo de request:

```json
{
  "nombre": "Firulais",
  "especie": "Perro",
  "raza": "Labrador",
  "fecha_nac": "2020-05-15",
  "peso": 28.5
}
```

#### Respuestas posibles:

- **201 Created**: Mascota registrada con éxito
- **400 Bad Request**: Faltan campos obligatorios
- **500 Internal Server Error**: Error del servidor

---

### 2. Listar todas las mascotas (Admin)

**URL**: `/`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Administrador (rol_id = 1)

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "nombre": "Firulais",
      "especie": "Perro",
      "raza": "Labrador",
      "fecha_nac": "2020-05-15",
      "peso": 28.5,
      "foto": null,
      "duenho_id": 3,
      "duenho_nombre": "Juan Pérez"
    }
  ]
}
```

---

### 3. Obtener detalle de mascota

**URL**: `/{id}`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Dueño de la mascota o admin

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "nombre": "Firulais",
    "especie": "Perro",
    "raza": "Labrador",
    "fecha_nac": "2020-05-15",
    "peso": 28.5,
    "foto": null,
    "duenho_id": 3,
    "duenho_nombre": "Juan Pérez"
  }
}
```

---

### 4. Editar mascota

**URL**: `/{id}`
**Método**: `PUT`
**Autenticación requerida**: Sí
**Permisos requeridos**: Dueño de la mascota o admin

#### Campos editables:

Todos los campos son opcionales (solo se actualizan los proporcionados)

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "message": "Mascota actualizada correctamente",
  "data": {
    "id": 1,
    "nombre": "Firulais",
    "especie": "Perro",
    "raza": "Labrador Retriever",
    "fecha_nac": "2020-05-15",
    "peso": 30.2,
    "foto": null
  }
}
```

---

### 5. Eliminar mascota

**URL**: `/{id}`
**Método**: `DELETE`
**Autenticación requerida**: Sí
**Permisos requeridos**: Dueño de la mascota o admin

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "message": "Mascota eliminada correctamente"
}
```

---

## Consideraciones adicionales

1. **Seguridad**:

   - Validación de permisos en cada operación
   - Solo el dueño o admin puede ver/editar/eliminar mascotas
2. **Relaciones**:

   - Integridad referencial con la tabla USUARIOS
   - JOIN automático para mostrar info del dueño
3. **Validaciones**:

   - Verificación de existencia antes de operaciones
   - Campos obligatorios en registro
4. **Estructura**:

   - Respuestas estandarizadas
   - Manejo completo de errores
