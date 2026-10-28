import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local, .env silently (clean stdout for MCP JSON-RPC)
dotenv.config({ path: path.join(__dirname, '.env.local'), quiet: true });
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase no está configurado. Por favor define SUPABASE_URL (o VITE_SUPABASE_URL) y SUPABASE_ANON_KEY (o VITE_SUPABASE_ANON_KEY) en .env.local o variables de entorno.'
    );
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

const server = new Server(
  {
    name: 'negro-supabase-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'supabase_status',
        description:
          'Verifica el estado de conexión con Supabase y el número de registros en products y orders.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'supabase_list_products',
        description: 'Obtiene el catálogo de productos almacenados en Supabase.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filtrar por categoría (Hombre, Mujer, Accesorios, Archivo)',
            },
            status: {
              type: 'string',
              description: 'Filtrar por estado (ACTIVO, STOCK BAJO, PAUSADO)',
            },
            limit: {
              type: 'number',
              description: 'Límite de registros (por defecto 50)',
            },
          },
        },
      },
      {
        name: 'supabase_get_product',
        description: 'Obtiene los detalles de un producto específico por ID o SKU en Supabase.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'UUID del producto' },
            sku: { type: 'string', description: 'Código SKU del producto (ej: AES-001)' },
          },
        },
      },
      {
        name: 'supabase_create_product',
        description: 'Crea un nuevo producto en la base de datos de Supabase.',
        inputSchema: {
          type: 'object',
          required: ['name', 'sku', 'price', 'stock', 'category'],
          properties: {
            name: { type: 'string', description: 'Nombre de la prenda/accesorio' },
            sku: { type: 'string', description: 'Código único SKU (ej: AES-205)' },
            price: { type: 'number', description: 'Precio en COP (pesos colombianos)' },
            stock: { type: 'number', description: 'Cantidad en inventario' },
            category: {
              type: 'string',
              enum: ['Hombre', 'Mujer', 'Accesorios', 'Archivo'],
              description: 'Categoría de la prenda',
            },
            status: {
              type: 'string',
              enum: ['ACTIVO', 'STOCK BAJO', 'PAUSADO'],
              default: 'ACTIVO',
            },
            image: { type: 'string', description: 'URL de la imagen o base64' },
            description: { type: 'string', description: 'Descripción editorial de la prenda' },
            sizes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tallas disponibles (ej: ["S", "M", "L", "XL"])',
            },
            featured: { type: 'boolean', default: false },
          },
        },
      },
      {
        name: 'supabase_update_product',
        description: 'Actualiza campos de un producto existente en Supabase.',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'UUID del producto a modificar' },
            name: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'number' },
            category: { type: 'string' },
            status: { type: 'string' },
            image: { type: 'string' },
            description: { type: 'string' },
            sizes: { type: 'array', items: { type: 'string' } },
            featured: { type: 'boolean' },
          },
        },
      },
      {
        name: 'supabase_delete_product',
        description: 'Elimina un producto del catálogo en Supabase por ID.',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'UUID del producto a eliminar' },
          },
        },
      },
      {
        name: 'supabase_list_orders',
        description: 'Obtiene las órdenes de compra registradas con sus artículos asociados en Supabase.',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filtrar por estado (PROCESANDO, ENVIADO, ENTREGADO, CANCELADO)',
            },
            limit: { type: 'number', default: 50 },
          },
        },
      },
      {
        name: 'supabase_update_order_status',
        description: 'Actualiza el estado de una orden de compra en Supabase.',
        inputSchema: {
          type: 'object',
          required: ['order_id', 'status'],
          properties: {
            order_id: { type: 'string', description: 'ID de la orden (ej: #ORD-9120)' },
            status: {
              type: 'string',
              enum: ['PROCESANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'],
            },
          },
        },
      },
      {
        name: 'supabase_query_table',
        description: 'Realiza una consulta SELECT flexible en cualquier tabla de Supabase.',
        inputSchema: {
          type: 'object',
          required: ['table'],
          properties: {
            table: { type: 'string', description: 'Nombre de la tabla (ej: products, orders, order_items)' },
            select: { type: 'string', default: '*', description: 'Campos a seleccionar' },
            limit: { type: 'number', default: 20 },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const supabase = getSupabaseClient();

    switch (name) {
      case 'supabase_status': {
        const { count: productCount, error: pErr } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        const { count: orderCount, error: oErr } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        const status = {
          connected: !pErr && !oErr,
          url: supabaseUrl,
          productsCount: productCount ?? 0,
          ordersCount: orderCount ?? 0,
          productsError: pErr ? pErr.message : null,
          ordersError: oErr ? oErr.message : null,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(status, null, 2) }],
        };
      }

      case 'supabase_list_products': {
        let query = supabase.from('products').select('*');
        if (args?.category) query = query.eq('category', args.category);
        if (args?.status) query = query.eq('status', args.status);
        if (args?.limit) query = query.limit(Number(args.limit));
        else query = query.limit(50);
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        return {
          content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }],
        };
      }

      case 'supabase_get_product': {
        let query = supabase.from('products').select('*');
        if (args?.id) query = query.eq('id', args.id);
        else if (args?.sku) query = query.eq('sku', args.sku);
        else throw new Error('Se requiere proveer id o sku.');

        const { data, error } = await query.single();
        if (error) throw error;

        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }

      case 'supabase_create_product': {
        const productPayload = {
          name: args.name,
          sku: args.sku,
          price: Number(args.price),
          stock: Number(args.stock),
          category: args.category,
          status: args.status || 'ACTIVO',
          image: args.image || '',
          description: args.description || '',
          sizes: Array.isArray(args.sizes) ? args.sizes : ['Única'],
          featured: Boolean(args.featured),
        };

        const { data, error } = await supabase
          .from('products')
          .insert(productPayload)
          .select('*')
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `✓ Producto creado exitosamente en Supabase:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'supabase_update_product': {
        const { id, ...updateFields } = args;
        const { data, error } = await supabase
          .from('products')
          .update(updateFields)
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `✓ Producto actualizado exitosamente:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'supabase_delete_product': {
        const { error } = await supabase.from('products').delete().eq('id', args.id);
        if (error) throw error;

        return {
          content: [{ type: 'text', text: `✓ Producto con ID ${args.id} eliminado de Supabase.` }],
        };
      }

      case 'supabase_list_orders': {
        let query = supabase.from('orders').select('*, order_items(*)');
        if (args?.status) query = query.eq('status', args.status);
        if (args?.limit) query = query.limit(Number(args.limit));
        else query = query.limit(50);
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        return {
          content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }],
        };
      }

      case 'supabase_update_order_status': {
        const { data, error } = await supabase
          .from('orders')
          .update({ status: args.status })
          .eq('id', args.order_id)
          .select('*')
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: 'text',
              text: `✓ Orden ${args.order_id} actualizada a estado: ${args.status}\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'supabase_query_table': {
        const { data, error } = await supabase
          .from(args.table)
          .select(args.select || '*')
          .limit(Number(args.limit) || 20);

        if (error) throw error;

        return {
          content: [{ type: 'text', text: JSON.stringify(data ?? [], null, 2) }],
        };
      }

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
        ? error.message || JSON.stringify(error)
        : String(error);

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error al interactuar con Supabase: ${errorMsg}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Negro Supabase MCP Server iniciado sobre Stdio');
}

main().catch((err) => {
  console.error('Error fatal al iniciar Negro Supabase MCP Server:', err);
  process.exit(1);
});
