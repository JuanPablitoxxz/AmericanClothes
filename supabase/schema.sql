-- ==============================================================================
-- SCHEMA LIMPIO PARA SUPABASE - AMERICAN CLOTHES / ATELIER NEGRO
-- ==============================================================================

-- 1. TABLAS PRINCIPALES
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

-- 2. HABILITAR SEGURIDAD (ROW LEVEL SECURITY)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACCESO
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

DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
