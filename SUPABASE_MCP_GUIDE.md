# Servidor MCP de Supabase para American Clothes

Este servidor Model Context Protocol (MCP) conecta a los asistentes de inteligencia artificial (Antigravity, Claude, Cursor) directamente con la base de datos de **Supabase** de tu proyecto.

---

### Configuración en Antigravity

El servidor ya ha sido registrado globalmente en tu archivo de configuración de Antigravity:
`C:\Users\juanp\.gemini\config\mcp_config.json`:

```json
{
  "mcpServers": {
    "negro-supabase": {
      "command": "node",
      "args": [
        "C:\\Users\\juanp\\OneDrive\\Escritorio\\Negro\\mcp-supabase-server.mjs"
      ],
      "env": {}
    }
  }
}
```

---

### Variables de Conexión

Edita el archivo `.env.local` en la raíz de tu proyecto (`C:\Users\juanp\OneDrive\Escritorio\Negro\.env.local`):

```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu_anon_key_de_supabase"
# Opcional (si deseas permisos administrativos completos)
# SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
```

> **¿Dónde obtenerlas?**  
> Ve a tu dashboard en [Supabase](https://supabase.com/dashboard) > Selecciona tu proyecto > **Project Settings** > **API**.

---

### Herramientas MCP Disponibles

El servidor expone las siguientes herramientas:

1. **`supabase_status`**: Verifica si la base de datos responde y reporta el conteo de productos y órdenes.
2. **`supabase_list_products`**: Lista el catálogo con filtros por categoría (`Hombre`, `Mujer`, `Accesorios`, `Archivo`) o estado (`ACTIVO`, `STOCK BAJO`, `PAUSADO`).
3. **`supabase_get_product`**: Consulta un producto específico por su código SKU o UUID.
4. **`supabase_create_product`**: Registra un nuevo producto en Supabase con nombre, SKU, precio en COP, stock, categoría, tallas y foto.
5. **`supabase_update_product`**: Actualiza campos (precio, stock, estado, imagen) de un producto existente.
6. **`supabase_delete_product`**: Elimina un producto por su ID.
7. **`supabase_list_orders`**: Lista todos los pedidos con sus ítems, datos del cliente, estado y total.
8. **`supabase_update_order_status`**: Modifica el estado del pedido (`PROCESANDO`, `ENVIADO`, `ENTREGADO`, `CANCELADO`).
9. **`supabase_query_table`**: Consulta flexible (`SELECT`) sobre cualquier tabla del proyecto.

---

### Esquema Inicial de la Base de Datos

Si creaste un proyecto nuevo en Supabase, ejecuta el script SQL ubicado en:
`supabase/schema.sql` desde el **SQL Editor** de tu panel de Supabase para crear las tablas `products`, `orders` y `order_items` con sus políticas de seguridad.
