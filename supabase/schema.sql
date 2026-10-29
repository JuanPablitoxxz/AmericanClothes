-- ==============================================================================
-- SCHEMA COMPLETO 100% SUPABASE - AMERICAN CLOTHES
-- Incluye: Usuarios (app_users), Historial de Sesiones (login_logs),
-- Configuración (store_settings), Productos (products) y Pedidos (orders)
-- ==============================================================================

-- 1. TABLA DE USUARIOS REGISTRADOS Y ROLES (ADMIN / CLIENTE)
CREATE TABLE IF NOT EXISTS public.app_users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (char_length(email) <= 254),
  name text NOT NULL CHECK (char_length(name) <= 100),
  phone text CHECK (char_length(phone) <= 25),
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  salt text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. TABLA DE AUDITORÍA E HISTORIAL DE INICIOS DE SESIÓN
CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  email text NOT NULL,
  name text,
  role text,
  status text NOT NULL CHECK (status IN ('EXITOSO', 'FALLIDO', 'BLOQUEADO_SQLI')),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. TABLA DE CONFIGURACIÓN GLOBAL DE LA TIENDA
CREATE TABLE IF NOT EXISTS public.store_settings (
  id text PRIMARY KEY DEFAULT 'default',
  shader_opacity numeric NOT NULL DEFAULT 0.3,
  currency text NOT NULL DEFAULT 'COP',
  announcement_text text NOT NULL DEFAULT 'Envíos gratis a Colombia por compras superiores a $350.000 COP',
  whatsapp_number text NOT NULL DEFAULT '573001234567',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. TABLAS PRINCIPALES DE COMERCIO
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text NOT NULL UNIQUE,
  price integer NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text NOT NULL CHECK (category IN ('Hombre', 'Mujer', 'Accesorios', 'Archivo')),
  status text NOT NULL CHECK (status IN ('ACTIVO', 'STOCK BAJO', 'PAUSADO')),
  image text NOT NULL,
  description text NOT NULL,
  sizes text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  customer_name text NOT NULL,
  email text NOT NULL,
  total integer NOT NULL CHECK (total >= 0),
  status text NOT NULL CHECK (status IN ('PROCESANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO')),
  shipping_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  size text,
  image text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. HABILITAR SEGURIDAD (ROW LEVEL SECURITY)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS DE ACCESO
DROP POLICY IF EXISTS "Public access app_users" ON public.app_users;
CREATE POLICY "Public access app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access login_logs" ON public.login_logs;
CREATE POLICY "Public access login_logs" ON public.login_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access store_settings" ON public.store_settings;
CREATE POLICY "Public access store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert products" ON public.products;
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update products" ON public.products;
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete products" ON public.products;
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete orders" ON public.orders;
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- 7. MIGRAR AUTOMÁTICAMENTE USUARIOS EXISTENTES A LA TABLA app_users
INSERT INTO public.app_users (id, email, name, phone, role, salt, password_hash, created_at)
SELECT
  COALESCE((shipping_address::jsonb)->>'id', id),
  LOWER(email),
  customer_name,
  (shipping_address::jsonb)->>'phone',
  COALESCE((shipping_address::jsonb)->>'role', 'client'),
  (shipping_address::jsonb)->>'salt',
  (shipping_address::jsonb)->>'passwordHash',
  created_at
FROM public.orders
WHERE id LIKE '__SYS_USER__:%'
ON CONFLICT (email) DO NOTHING;

DELETE FROM public.orders WHERE id LIKE '__SYS_%';
