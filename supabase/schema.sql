-- Supabase schema for the AESTHETE Colombia storefront.
-- Run this in Supabase SQL Editor before setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category text not null check (category in ('Hombre', 'Mujer', 'Accesorios', 'Archivo')),
  status text not null check (status in ('ACTIVO', 'STOCK BAJO', 'PAUSADO')),
  image text not null,
  description text not null,
  sizes text[] not null default '{}',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  email text not null,
  total integer not null check (total >= 0),
  status text not null check (status in ('PROCESANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO')),
  shipping_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  price integer not null check (price >= 0),
  quantity integer not null check (quantity > 0),
  size text,
  image text not null,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_featured_created_idx on public.products(featured desc, created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Demo policies: this app currently has no Supabase Auth login, so the browser anon key
-- needs read/write access for the storefront and admin panel to persist changes.
-- Before production, replace these with authenticated admin-only write policies.

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products for select
using (true);

drop policy if exists "Public can create products" on public.products;
create policy "Public can create products"
on public.products for insert
with check (true);

drop policy if exists "Public can update products" on public.products;
create policy "Public can update products"
on public.products for update
using (true)
with check (true);

drop policy if exists "Public can delete products" on public.products;
create policy "Public can delete products"
on public.products for delete
using (true);

drop policy if exists "Public can read orders" on public.orders;
create policy "Public can read orders"
on public.orders for select
using (true);

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders for insert
with check (true);

drop policy if exists "Public can update orders" on public.orders;
create policy "Public can update orders"
on public.orders for update
using (true)
with check (true);

drop policy if exists "Public can read order items" on public.order_items;
create policy "Public can read order items"
on public.order_items for select
using (true);

drop policy if exists "Public can create order items" on public.order_items;
create policy "Public can create order items"
on public.order_items for insert
with check (true);
