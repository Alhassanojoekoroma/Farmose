-- Farmose's persistent Vercel data. Import the former D1 rows with
-- scripts/import-d1.mjs after applying this migration.
CREATE TABLE IF NOT EXISTS catalog_products (
  slug text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  category text NOT NULL,
  tag text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  unit text NOT NULL,
  image text NOT NULL,
  image_url text,
  image_public_id text,
  additional_images_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock_quantity integer NOT NULL DEFAULT 0,
  video text NOT NULL DEFAULT '',
  image_position text NOT NULL DEFAULT 'center',
  color text NOT NULL,
  rating numeric(4,2) NOT NULL DEFAULT 5,
  reviews integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  details text NOT NULL,
  features_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  site_visible boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_products_order_idx ON catalog_products (sort_order, slug);

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'custom',
  permissions text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id bigint PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  address text NOT NULL,
  area text NOT NULL,
  notes text NOT NULL DEFAULT '',
  payment_method text NOT NULL,
  items_json jsonb NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  delivery_fee numeric(12,2) NOT NULL,
  total numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public_updates (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('promotion', 'news', 'visit', 'program')),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  link_url text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_updates_window CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS public_updates_schedule_idx ON public_updates (published, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS media_assets (
  key text PRIMARY KEY,
  url text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('image', 'video')),
  size_bytes bigint NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_uploads (
  id uuid PRIMARY KEY,
  owner_email text NOT NULL,
  object_key text NOT NULL,
  object_upload_id text NOT NULL,
  content_type text NOT NULL,
  declared_size bigint NOT NULL,
  total_parts integer NOT NULL,
  parts jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
