## 🧾 API de Ventas (`/api/sales`)

### `POST /api/sales`

**Descripción:**

Crea una nueva venta. Se debe proporcionar el ID del cliente y una lista de productos con cantidades.

**Body JSON:**

```json
{
  "cliente_id": 2,
  "productos": [
    {
      "producto_id": 1,
      "cantidad": 2
    },
    {
      "producto_id": 3,
      "cantidad": 1
    }
  ]
}
```

**Respuesta Exitosa:**

```json
{
  "message": "Venta registrada con éxito",
  "venta_id": 10
}
```

**Errores comunes:**

* `400 Bad Request` – Falta cliente o productos, o stock insuficiente
* `500 Internal Server Error` – Error al procesar la venta

---

### `GET /api/sales/:id`

**Descripción:**

Obtiene los detalles de una venta, incluyendo los productos vendidos.

**Parámetros de URL:**

* `id` – ID de la venta

**Respuesta Exitosa:**

```json
{
  "id": 10,
  "cliente_id": 2,
  "fecha": "2025-06-11T14:00:00.000Z",
  "total": 350.0,
  "detalles": [
    {
      "id": 1,
      "venta_id": 10,
      "producto_id": 1,
      "cantidad": 2,
      "subtotal": 300.0,
      "nombre": "Croquetas para perro",
      "precio": 150.0
    },
    ...
  ]
}
```

**Códigos de estado:**

* `200 OK` – Venta encontrada
* `404 Not Found` – Venta no encontrada
* `500 Internal Server Error` – Error interno

---

### `GET /api/sales/user/:id`

**Descripción:**

Obtiene todas las ventas asociadas a un usuario específico.

**Parámetros de URL:**

* `id` – ID del usuario

**Respuesta Exitosa:**

```json
[
  {
    "id": 10,
    "cliente_id": 2,
    "fecha": "2025-06-11T14:00:00.000Z",
    "total": 350.0
  },
  ...
]
```

**Códigos de estado:**

* `200 OK` – Ventas encontradas
* `500 Internal Server Error` – Error al consultar las ventas
