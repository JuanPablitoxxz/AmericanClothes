-- ==============================================================================
-- SCHEMA COMPLETO PARA SUPABASE - ATELIER NEGRO / AMERICAN CLOTHES
-- ==============================================================================
-- Copia todo este texto y pégalo en:
-- Supabase Dashboard > Tu Proyecto > SQL Editor > Nuevo Query > RUN
-- ==============================================================================

-- 1. CREACIÓN DE TABLAS PRINCIPALES
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

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

-- 3. HABILITAR SEGURIDAD DE FILA (ROW LEVEL SECURITY)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO PARA PRODUCTS (Lectura y Gestión)
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert products" ON public.products;
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update products" ON public.products;
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete products" ON public.products;
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

-- 5. POLÍTICAS DE ACCESO PARA ORDERS
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- 6. POLÍTICAS DE ACCESO PARA ORDER_ITEMS
DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
CREATE POLICY "Public read order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- 7. PRODUCTOS INICIALES DEL CATÁLOGO
INSERT INTO public.products (name, sku, price, stock, category, status, image, description, sizes, featured)
VALUES
('Bolso Tote de Obsidiana', 'AES-001', 3560000, 24, 'Accesorios', 'ACTIVO', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDe8JFelISU8TiNUjGi_bscGbRRuZpQiYRbbmzoOXJGdEweGYCQsVwHdSkmR5m0X9qGyvvjN6MOPPCBsB61M1Uscn_4bwQ_XZsK5eKqjyfEZTo3op4zYnD5RRjkzwS35Cp9SwUaJi2lXSYL8Yotxim3wDveH8LLeMT1q3pYSEepnYqECKV766_obVtzw5ToXAI4JHqAHH94pM3_xOG-gb8Z6UzG0z0nfm_jypx5-3YEGCLGdXxdqfPr', 'Bolso tote esculpido en piel de becerro obsidian con acabado mate artesanal.', ARRAY['Única'], true),
('Anillo de Oro Aura', 'AES-042', 1800000, 3, 'Accesorios', 'STOCK BAJO', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfjyvqYWns8yuitOFcLQg4EOoNjXzMOlwHJtmeaHETi8aTxE0MOqoGKCFWEbbJWLvIXlnSNX6yqf_I-zH1PmuKQBjDdH3EUKZnzmORgqaIOJx3sj4bYADv5UlqrJgJtJaNf1Utwfw74dyi7hDymcYUpCe4WwQGA6Z1g1ULo7_38AHSj5OY8gqHLO7IE-wJ3TGz29ZWXiBsBtpCIAMQ4ZJKdmy4AyYv7oJi-mOf2P9I8A9tMriawFZw', 'Anillo minimalista fundido en oro de 18 quilates con textura orgánica.', ARRAY['S (16mm)', 'M (18mm)', 'L (20mm)'], true),
('Popelina Estructurada', 'AES-112', 1280000, 45, 'Hombre', 'PAUSADO', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn173ZrO-KE0yIlZzVUpcu5TcJYgiFmesKV_WPLnqQ5kOgdnn_-TdCUGdoqYJoA2IPwdobVgZNminUQYzhjGz6K4VmZGslyzmWqaAX9EbWaCRqwEscLTMG1DNcJ_rqHcqNpcCs5QdHXR8nwvfWjwU8kU0r2_RDCOU_yVqM8SIYqgk-CuUHagN7kYPe2Bq_YcpQs8er9i8qd-ANrX8EWQX-x1D1vu1f1MakRo8G_NVOf4sEBnhlBNbv', 'Camisa de popelín de algodón egipcio de corte sobredimensionado.', ARRAY['S', 'M', 'L', 'XL'], false),
('Gabardina de Terciopelo Esmeralda', 'AES-088', 5800000, 8, 'Mujer', 'ACTIVO', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBekPNiB5SekzdQRdiuovgz8pw1jYbD0CkGbxz7kTlcNr033nWxGrQsEGuZ_MwIuHQ1lUksfHCPPh_E5zJV4os7tu6JnUioJdwM--0I4lIalIhbDoZYQAWaapUDzAcuIPy9ODUj5-aIjS6TKgEleRQ346kWDVcoLgyUGX7NI_VWiZ-1hlOMPMNFTJ-Bm5c5VjMHkDMD6nXKj942WWdOaIKGRyY7oc9csADkVsyT1HlXTK4atN6qUxAD', 'Abrigo trench de terciopelo de seda en tono verde esmeralda profundo.', ARRAY['XS', 'S', 'M', 'L'], true),
('Parka Táctica Urbana', 'AES-204', 5120000, 12, 'Hombre', 'ACTIVO', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWEcEanj9Y0-mkFZ8DJ-XD0kyCVvOl2EreiIYDNT77nGjL_p15Ana9-FtpOXOI8KI67CLzIgAck9qByYynfn98WOu2TKDEosTURJjHh87VhSowp3fyfpYt51pegR2zDnlpHFllAYeQJ87gNsnIV_YlYy9pUmbuxUifkb-_rax9p0jG04ZVwbpR--HFRRX_PvctfpbIWlQ5vGOOzkPvKl6_8fnLQn6RswtmDHnXjh4Flg74I0_qoEWj', 'Parka técnica multicapa de inspiración militar avant-garde.', ARRAY['M', 'L', 'XL'], true),
('Colgante de Rubí Imperial', 'AES-019', 8400000, 2, 'Accesorios', 'STOCK BAJO', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSeU26lRHqYN8xOs4-6k8cy2ZxtfMgVGR4FjOyfXyD-IEZ3927JD79l8sTRzqyx_-X8wRoqNk_h2-u8WHdW2nAQCVeL3dmpec5xgdIDc2XgKjWjpOFTwFOEWmh9UgsLqoAmBKDeXAmhoo-KOacfysRind9dpbiRAZ1tNwECHjjKOJKFgtlKiL8jTfROFuqD-HKfe7CfP3__rDvMcgiuEsriZRUbbCMS49N6QINdehfmmZzspsr3NLE', 'Colgante de rubí corte cojín engarzado en marco de oro amarillo de 24K.', ARRAY['Única'], true)
ON CONFLICT (sku) DO NOTHING;
