# Descripción

Este documento describe los endpoints disponibles para el manejo de notificaciones en el sistema UniPets.

## Base URL

`{api_url}:50500/notifs`

## Endpoints

### 1. Enviar notificación

**URL**: `/`
**Método**: `POST`
**Autenticación requerida**: Sí
**Permisos requeridos**: Administrador (rol_id = 1)

#### Campos requeridos en el body:

| Campo      | Tipo   | Descripción                  |
| ---------- | ------ | ----------------------------- |
| usuario_id | number | ID del usuario destinatario   |
| mensaje    | string | Contenido de la notificación |

#### Ejemplo de request:

```json
{
  "usuario_id": 5,
  "mensaje": "Recordatorio: Cita programada para mañana a las 15:00"
}
```

#### Respuestas posibles:

- **201 Created**: Notificación enviada con éxito
- **400 Bad Request**: Faltan campos obligatorios
- **404 Not Found**: Usuario no encontrado
- **500 Internal Server Error**: Error del servidor

---

### 2. Obtener notificaciones del usuario

**URL**: `/`
**Método**: `GET`
**Autenticación requerida**: Sí
**Permisos requeridos**: Cualquier usuario autenticado

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "data": [
    {
      "id": 12,
      "mensaje": "Recordatorio: Vacuna anual pendiente",
      "fecha": "2023-05-15 10:30:00",
      "leida": false
    },
    {
      "id": 8,
      "mensaje": "Bienvenido a UniPets!",
      "fecha": "2023-05-10 09:15:00",
      "leida": true
    }
  ]
}
```

---

### 3. Marcar notificación como leída

**URL**: `/{id}/read`
**Método**: `PUT`
**Autenticación requerida**: Sí
**Permisos requeridos**: Dueño de la notificación

#### Respuesta exitosa (200 OK):

```json
{
  "code": 200,
  "message": "Notificación marcada como leída"
}
```

#### Respuestas de error:

- **404 Not Found**: Notificación no encontrada o no tienes permisos
- **500 Internal Server Error**: Error del servidor

---

## Consideraciones adicionales

1. **Seguridad**:

   - Solo admins pueden enviar notificaciones
   - Cada usuario solo puede ver/marcar sus propias notificaciones
   - Validación de existencia de usuario al enviar notificaciones
2. **Ordenamiento**:

   - Las notificaciones se devuelven ordenadas por fecha (más recientes primero)
3. **Estados**:

   - `leida`: boolean (0 = no leída, 1 = leída)
   - Se actualiza automáticamente al usar el endpoint correspondiente
4. **Uso típico**:

   - Recordatorios de citas
   - Notificaciones del sistema
   - Alertas importantes
   - Mensajes administrativos
5. **Extensibilidad**:

   - Podrías añadir un campo `tipo` para clasificar notificaciones
   - Considera añadir un campo `url_accion` para notificaciones interactivas
   - Podrías implementar notificaciones push con WebSockets
