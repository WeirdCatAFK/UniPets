## 📦 API de Productos (`/api/products`)

### `GET /api/products`

**Descripción:**

Obtiene una lista de todos los productos disponibles.

**Respuesta Exitosa:**

```json
[
  {
    "id": 1,
    "nombre": "Croquetas para perro",
    "precio": 150.0,
    "stock": 20,
    "categoria": "Alimentos"
  },
  ...
]
```

**Códigos de estado:**

* `200 OK` – Productos encontrados
* `500 Internal Server Error` – Error al consultar la base de datos

---

### `GET /api/products/:id`

**Descripción:**

Obtiene los detalles de un producto específico por su `id`.

**Parámetros de URL:**

* `id` – ID del producto

**Respuesta Exitosa:**

```json
{
  "id": 1,
  "nombre": "Croquetas para perro",
  "precio": 150.0,
  "stock": 20,
  "categoria": "Alimentos"
}
```

**Códigos de estado:**

* `200 OK` – Producto encontrado
* `404 Not Found` – Producto no encontrado
* `500 Internal Server Error` – Error al consultar la base de datos
