# Descripción

Este documento describe los endpoints disponibles para el manejo de autenticación y registro de usuarios en el sistema UniPets.

## Base URL

`{api_url}:50500/auth`

## Endpoints

### 1. Registrar nuevo usuario

**URL**: `auth/register`
**Método**: `POST`
**Autenticación requerida**: No

#### Campos requeridos en el body:

| Campo    | Tipo   | Descripción                                                 |
| -------- | ------ | ------------------------------------------------------------ |
| nombre   | string | Nombre completo del usuario                                  |
| email    | string | Email del usuario (único)                                   |
| password | string | Contraseña del usuario                                      |
| rol_id   | number | ID del rol del usuario (1: admin, 2: veterinario, 3: dueño) |

#### Ejemplo de request:

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "micontraseña123",
  "rol_id": 3
}
```

#### Respuestas posibles:

- **201 Created**: Usuario registrado con éxito

  ```json
  {
    "message": "Usuario registrado con éxito."
  }
  ```
- **400 Bad Request**: Faltan campos obligatorios

  ```json
  {
    "message": "Todos los campos son obligatorios."
  }
  ```
- **409 Conflict**: Email ya registrado

  ```json
  {
    "message": "El email ya está registrado."
  }
  ```
- **500 Internal Server Error**: Error del servidor

  ```json
  {
    "message": "Error interno del servidor."
  }
  ```

### 2. Iniciar sesión

**URL**: `/login`
**Método**: `POST`
**Autenticación requerida**: No

#### Campos requeridos en el body:

| Campo    | Tipo   | Descripción            |
| -------- | ------ | ----------------------- |
| email    | string | Email del usuario       |
| password | string | Contraseña del usuario |

#### Ejemplo de request:

```json
{
  "email": "juan@example.com",
  "password": "micontraseña123"
}
```

#### Respuesta exitosa (200 OK):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoiSnVhbiBQw6lyZXoiLCJlbWFpbCI6Imp1YW5AZXhhbXBsZS5jb20iLCJyb2xfaWQiOjMsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxNjE2MjQ2MjIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
```

#### Respuestas de error:

- **401 Unauthorized**: Credenciales inválidas

  ```json
  {
    "message": "Credenciales inválidas."
  }
  ```
- **500 Internal Server Error**: Error del servidor

  ```json
  {
    "message": "Error interno del servidor."
  }
  ```

## Uso del token

El token JWT recibido debe incluirse en las cabeceras de las solicitudes a endpoints protegidos de la siguiente manera:

```
Authorization: Bearer <token>
```

El token tiene una validez de 2 horas. Después de este tiempo, el usuario deberá volver a iniciar sesión para obtener un nuevo token.

## Roles de usuario

Los posibles valores para `rol_id` son:

- 1: Administrador
- 2: Empleado
- 3: Cliente
