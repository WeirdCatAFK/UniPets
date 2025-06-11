
# Descripción

Este documento describe los endpoints disponibles para el manejo de dueños de mascotas en el sistema UniPets.

## Base URL

`{api_url}:50500/api/owners`

## Endpoints

### 1. Registrar nuevo dueño

**URL**: `/`
**Método**: `POST`
**Autenticación requerida**: No
**Permisos requeridos**: Ninguno

#### Campos requeridos en el body:

| Campo    | Tipo   | Descripción               |
| -------- | ------ | -------------------------- |
| nombre   | string | Nombre completo del dueño |
| email    | string | Email del dueño (único)  |
| password | string | Contraseña del dueño     |

#### Campos opcionales:

| Campo     | Tipo   | Descripción          |
| --------- | ------ | --------------------- |
| telefono  | string | Teléfono de contacto |
| direccion | string | Dirección del dueño |

#### Ejemplo de request:

```json
{
  "nombre": "María González",
  "email": "maria@example.com",
  "password": "securepassword123",
  "telefono": "+56987654321",
  "direccion": "Av. Principal 456"
}
```

#### Respuestas posibles:

- **201 Created**: Dueño registrado con éxito

  ```json
  {
    "code": 201,
    "message": "Dueño registrado exitosamente",
    "data": {
      "id": 5,
      "nombre": "María González",
      "email": "maria@example.com",
      "rol_id": 3
    }
  }
  ```
- **400 Bad Request**: Faltan campos obligatorios

  ```json
  {
    "code": 400,
    "message": "Nombre, email y password son requeridos"
  }
  ```
- **409 Conflict**: Email ya registrado

  ```json
  {
    "code": 409,
    "message": "El email ya está registrado"
  }
  ```
- **500 Internal Server Error**: Error del servidor

  ```json
  {
    "code": 500,
    "message": "Error interno del servidor"
  }
  ```

---

### 2. Listar todos los dueños (Admin)

**URL**: `/`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Administrador (rol_id = 1)

#### Headers requeridos:

| Campo         | Valor              | Descripción           |
| ------------- | ------------------ | ---------------------- |
| Authorization | Bearer {token_jwt} | Token de administrador |

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": [
    {
      "id": 3,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "telefono": "+56912345678",
      "direccion": "Calle Falsa 123"
    },
    {
      "id": 5,
      "nombre": "María González",
      "email": "maria@example.com",
      "telefono": "+56987654321",
      "direccion": "Av. Principal 456"
    }
  ]
}
```

#### Respuestas de error:

- **401 Unauthorized**: Token no proporcionado o inválido
- **403 Forbidden**: No tienes permisos de administrador
- **500 Internal Server Error**: Error del servidor

---

### 3. Obtener información de un dueño específico

**URL**: `/{ownerId}`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Mismo dueño o administrador

#### Parámetros en URL:

| Parámetro | Tipo   | Descripción           |
| ---------- | ------ | ---------------------- |
| ownerId    | number | ID del dueño a buscar |

#### Headers requeridos:

| Campo         | Valor              | Descripción  |
| ------------- | ------------------ | ------------- |
| Authorization | Bearer {token_jwt} | Token válido |

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": {
    "id": 5,
    "nombre": "María González",
    "email": "maria@example.com",
    "telefono": "+56987654321",
    "direccion": "Av. Principal 456",
    "foto": "https://storage.example.com/fotos/5.jpg"
  }
}
```

#### Respuestas de error:

- **401 Unauthorized**: Token no proporcionado o inválido
- **403 Forbidden**: No tienes permiso para ver este perfil
- **404 Not Found**: Dueño no encontrado
- **500 Internal Server Error**: Error del servidor

---

### 4. Obtener mascotas de un dueño

**URL**: `/{ownerId}/pets`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Mismo dueño o administrador

#### Parámetros en URL:

| Parámetro | Tipo   | Descripción  |
| ---------- | ------ | ------------- |
| ownerId    | number | ID del dueño |

#### Headers requeridos:

| Campo         | Valor              | Descripción  |
| ------------- | ------------------ | ------------- |
| Authorization | Bearer {token_jwt} | Token válido |

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": [
    {
      "id": 12,
      "nombre": "Firulais",
      "especie": "Perro",
      "raza": "Labrador",
      "fecha_nac": "2020-05-15",
      "peso": 28.5,
      "foto": "https://storage.example.com/mascotas/12.jpg"
    },
    {
      "id": 15,
      "nombre": "Michi",
      "especie": "Gato",
      "raza": "Siamés",
      "fecha_nac": "2021-02-20",
      "peso": 4.2,
      "foto": "https://storage.example.com/mascotas/15.jpg"
    }
  ]
}
```

#### Respuestas de error:

- **401 Unauthorized**: Token no proporcionado o inválido
- **403 Forbidden**: No tienes permiso para ver estas mascotas
- **404 Not Found**: Dueño no encontrado
- **500 Internal Server Error**: Error del servidor

---

## Consideraciones adicionales

1. **Seguridad**:

   - Las contraseñas nunca se devuelven en las respuestas
   - Todos los endpoints (excepto registro) requieren autenticación
   - Se recomienda HTTPS para todas las comunicaciones
2. **Control de acceso**:

   - Solo administradores pueden listar todos los dueños
   - Cada dueño solo puede ver/modificar su propia información
   - Administradores tienen acceso completo
3. **Validaciones**:

   - El email debe ser único en el sistema
   - Se verifica la existencia del dueño antes de mostrar mascotas
   - El rol_id para dueños es siempre 3 (no modificable)
4. **Formatos**:

   - Fechas en formato ISO 8601 (YYYY-MM-DD)
   - Pesos en formato decimal (kg)
   - URLs para fotos opcionales
