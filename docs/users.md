Aquí tienes la documentación completa para los endpoints de usuarios en el formato solicitado:

# Descripción

Este documento describe los endpoints disponibles para el manejo de usuarios en el sistema UniPets.

## Base URL

`{api_url}:50500/users`

## Endpoints

### 1. Obtener perfil del usuario autenticado

**URL**: `/me`
**Método**: `GET`
**Autenticación requerida**: Sí (Token JWT)
**Permisos requeridos**: Cualquier usuario autenticado

#### Headers requeridos:

| Campo         | Valor              | Descripción               |
| ------------- | ------------------ | -------------------------- |
| Authorization | Bearer {token_jwt} | Token obtenido en el login |

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": {
    "id": 123,
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol_id": 3,
    "created_at": "2023-01-15T10:30:00Z"
  }
}
```

#### Respuestas de error:

- **401 Unauthorized**: Token no proporcionado o inválido
- **404 Not Found**: Usuario no encontrado
- **500 Internal Server Error**: Error del servidor

---

### 2. Actualizar perfil del usuario autenticado

**URL**: `/me`
**Método**: `PUT`
**Autenticación requerida**: Sí (Token JWT)
**Permisos requeridos**: Cualquier usuario autenticado

#### Campos opcionales en el body:

| Campo  | Tipo   | Descripción             |
| ------ | ------ | ------------------------ |
| nombre | string | Nuevo nombre del usuario |
| email  | string | Nuevo email del usuario  |

#### Ejemplo de request:

```json
{
  "nombre": "Juan Pérez Actualizado",
  "email": "nuevoemail@example.com"
}
```

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": {
    "id": 123,
    "nombre": "Juan Pérez Actualizado",
    "email": "nuevoemail@example.com",
    "rol_id": 3
  }
}
```

#### Respuestas de error:

- **400 Bad Request**: Datos de entrada inválidos
- **409 Conflict**: El email ya está en uso
- **401 Unauthorized**: Token inválido
- **500 Internal Server Error**: Error del servidor

---

### 3. Obtener perfil de cualquier usuario (Admin)

**URL**: `/{id}`
**Método**: `GET`
**Autenticación requerida**: Sí (Token JWT)
**Permisos requeridos**: Administrador (rol_id = 1)

#### Parámetros en URL:

| Parámetro | Tipo   | Descripción                   |
| ---------- | ------ | ------------------------------ |
| id         | number | ID del usuario a buscar        |
| nombre     | string | Nombre del usuario a modificar |
| email      | string | Email del usuario a modificar  |

#### Ejemplo de request:

```
GET /users/456
```

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": {
    "id": 456,
    "nombre": "María García",
    "email": "maria@example.com",
    "rol_id": 2,
    "created_at": "2023-02-20T14:15:00Z"
  }
}
```

#### Respuestas de error:

- **403 Forbidden**: Usuario no es administrador
- **404 Not Found**: Usuario no encontrado
- **500 Internal Server Error**: Error del servidor

---

### 4. Modificar rol de usuario (Admin)

**URL**: `/{id}/role`
**Método**: `PUT`
**Autenticación requerida**: Sí (Token JWT)
**Permisos requeridos**: Administrador (rol_id = 1)

#### Campos requeridos en el body:

| Campo  | Tipo   | Descripción                    |
| ------ | ------ | ------------------------------- |
| rol_id | number | Nuevo ID de rol para el usuario |

#### Valores de rol permitidos:

| rol_id | Rol           |
| ------ | ------------- |
| 1      | Administrador |
| 2      | Empleado      |
| 3      | Cliente       |

#### Ejemplo de request:

```json
{
  "rol_id": 2
}
```

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "message": "Rol de usuario actualizado correctamente",
  "data": {
    "user_id": 456,
    "new_role_id": 2
  }
}
```

#### Respuestas de error:

- **400 Bad Request**: rol_id inválido o faltante
- **403 Forbidden**: Usuario no es administrador
- **404 Not Found**: Usuario no encontrado
- **500 Internal Server Error**: Error del servidor

---

## Consideraciones de seguridad

1. **Protección de datos**:

   - Nunca se exponen contraseñas en las respuestas
   - Los emails se validan para evitar duplicados
2. **Control de acceso**:

   - Endpoints administrativos requieren rol de administrador
   - Cada usuario solo puede modificar su propio perfil (excepto admins)
3. **Validaciones**:

   - Todos los inputs se validan antes de procesar
   - Se verifica existencia de usuarios y roles
4. **Transporte seguro**:

   - Se recomienda HTTPS para todas las comunicaciones
   - Los tokens JWT tienen expiración de 2 horas
5. **Auditoría**:

   - Todas las operaciones sensibles deberían registrarse
   - Los cambios de rol deberían notificarse al usuario afectado
