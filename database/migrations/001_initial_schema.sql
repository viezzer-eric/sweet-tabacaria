-- ══════════════════════════════════════════════════════════════
--  CAPIVARA SMOKE — Schema Completo para Supabase
--  Execute tudo no SQL Editor do Supabase (uma única vez)
-- ══════════════════════════════════════════════════════════════

-- ============================================================
-- 1. EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- busca sem acento

-- ============================================================
-- 2. ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('cliente', 'admin', 'fornecedor');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'out', 'delivered', 'cancelled');

-- ============================================================
-- 3. TABELAS
-- ============================================================

-- 3.1. FORNECEDORES
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(200) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  email           VARCHAR(255),
  commission_pct  DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (commission_pct >= 0 AND commission_pct <= 100),
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3.2. CATEGORIAS
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  icon_name   VARCHAR(50),
  active      BOOLEAN DEFAULT true,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3.3. PRODUTOS
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id   UUID NOT NULL REFERENCES suppliers(id),
  category_id   INT NOT NULL REFERENCES categories(id),
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(200) UNIQUE NOT NULL,
  description   TEXT,
  cost_price    INT CHECK (cost_price IS NULL OR cost_price >= 0),
  price         INT NOT NULL CHECK (price >= 0),
  old_price     INT CHECK (old_price IS NULL OR old_price >= 0),
  stock         INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  badge         VARCHAR(20) CHECK (badge IN ('new', 'sale', NULL)),
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Coluna para full-text search (preenchida via trigger)
ALTER TABLE products ADD COLUMN search_vector TSVECTOR;

-- 3.4. IMAGENS DOS PRODUTOS
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         VARCHAR(200),
  is_primary  BOOLEAN DEFAULT false,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3.5. USUÁRIOS (estende o auth.users do Supabase)
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  phone         VARCHAR(20),
  role          user_role NOT NULL DEFAULT 'cliente',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 3.6. ENDEREÇOS
CREATE TABLE addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  street        VARCHAR(200) NOT NULL,
  number        VARCHAR(10) NOT NULL,
  complement    VARCHAR(100),
  neighborhood  VARCHAR(100) NOT NULL,
  city          VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
  state         VARCHAR(2) NOT NULL DEFAULT 'SP',
  cep           VARCHAR(9) NOT NULL,
  is_default    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3.7. PEDIDOS
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id),
  address_id      UUID REFERENCES addresses(id),
  status          order_status NOT NULL DEFAULT 'pending',
  subtotal        INT NOT NULL CHECK (subtotal >= 0),
  discount        INT NOT NULL DEFAULT 0 CHECK (discount >= 0),
  shipping        INT NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  total           INT NOT NULL CHECK (total >= 0),
  coupon_code     VARCHAR(20),
  payment_method  VARCHAR(10) DEFAULT 'pix',
  paid_at         TIMESTAMPTZ,
  pix_qr_code     TEXT,
  pix_copy_paste  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3.8. ITENS DO PEDIDO
CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id),
  supplier_id       UUID NOT NULL REFERENCES suppliers(id),
  product_name      VARCHAR(200) NOT NULL,
  product_price     INT NOT NULL,
  quantity          INT NOT NULL CHECK (quantity > 0),
  subtotal          INT NOT NULL CHECK (subtotal >= 0),
  commission_pct    DECIMAL(5,2),
  commission_value  INT DEFAULT 0
);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================
CREATE INDEX idx_products_supplier      ON products(supplier_id);
CREATE INDEX idx_products_category      ON products(category_id);
CREATE INDEX idx_products_active        ON products(active) WHERE active = true;
CREATE INDEX idx_products_search        ON products USING GIN(search_vector);
CREATE INDEX idx_products_created       ON products(created_at DESC);

CREATE INDEX idx_product_images_product ON product_images(product_id);

CREATE INDEX idx_users_role             ON public.users(role);

CREATE INDEX idx_addresses_user         ON addresses(user_id);

CREATE INDEX idx_orders_user            ON orders(user_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_orders_created         ON orders(created_at DESC);

CREATE INDEX idx_order_items_order      ON order_items(order_id);
CREATE INDEX idx_order_items_supplier   ON order_items(supplier_id);

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- 5.1. Ativar RLS em todas as tabelas públicas
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;

-- Tabelas de leitura pública (qualquer um pode ver)
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images     ENABLE ROW LEVEL SECURITY;

-- 5.2. Políticas para tabelas públicas (leitura liberada)
CREATE POLICY "Produtos visíveis para todos"
  ON products FOR SELECT USING (active = true);

CREATE POLICY "Categorias visíveis para todos"
  ON categories FOR SELECT USING (active = true);

CREATE POLICY "Fornecedores ativos visíveis para todos"
  ON suppliers FOR SELECT USING (active = true);

CREATE POLICY "Imagens visíveis para todos"
  ON product_images FOR SELECT USING (true);

-- 5.3. Políticas para dados do próprio usuário
CREATE POLICY "Usuário vê apenas próprio perfil"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Usuário edita próprio perfil"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Usuário vê próprios endereços"
  ON addresses FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Usuário vê próprios pedidos"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuário vê itens dos próprios pedidos"
  ON order_items FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  ));

-- 5.4. Políticas para admin (acesso total)
CREATE POLICY "Admin acesso total users"
  ON public.users FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acesso total addresses"
  ON addresses FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acesso total orders"
  ON orders FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acesso total order_items"
  ON order_items FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- 6. FUNCTIONS AUXILIARES
-- ============================================================

-- 6.1. Sincronizar auth.users → public.users automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone',
    'cliente'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: quando criar no auth.users, cria em public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2. Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6.3. Atualizar search_vector dos produtos
CREATE OR REPLACE FUNCTION public.update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector(
    'portuguese',
    COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_search_vector
  BEFORE INSERT OR UPDATE OF name, description ON products
  FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vector();

-- ============================================================
-- 7. SEED DATA
-- ============================================================

-- 7.1. Fornecedor padrão (loja própria)
INSERT INTO suppliers (id, name, slug, phone, email, commission_pct) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Capivara Smoke (Loja Própria)',
    'capivara-smoke',
    '(11) 97651-9275',
    'contato@capivarasmoke.com.br',
    0.00
  );

-- 7.2. Categorias
INSERT INTO categories (name, slug, icon_name, sort_order) VALUES
  ('Sedas',        'sedas',        'FileText',  1),
  ('Trituradores', 'trituradores', 'Settings',  2),
  ('Isqueiros',    'isqueiros',    'Flame',     3),
  ('Acessórios',   'acessorios',   'Soup',      4);

-- 7.3. Produtos
INSERT INTO products (supplier_id, category_id, name, slug, description, price, old_price, stock, badge) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    1,
    'Seda King Size Extra Fina',
    'seda-king-size-extra-fina',
    'Seda premium extra fina para uma queima lenta e uniforme. Pacote com 24 unidades.',
    1200, 1500, 50, 'sale'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    1,
    'Seda de Vidro Borossilicato',
    'seda-vidro-borossilicato',
    'Seda de vidro borossilicato reutilizável. Fácil de limpar e ecônomica.',
    1800, NULL, 15, NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    2,
    'Triturador de Policarbonato',
    'triturador-policarbonato',
    'Triturador de policarbonato reforçado com 3 fases e imã coletor.',
    3500, NULL, 20, 'new'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    3,
    'Isqueiro Recarregável Premium',
    'isqueiro-recargavel-premium',
    'Isqueiro recarregável a gás com chama ajustável. Design slim.',
    990, NULL, 100, NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    4,
    'Cuia de Silicone Eco',
    'cuia-silicone-eco',
    'Cuia de silicone ecológico atóxico. Disponível em 3 cores.',
    2200, NULL, 30, NULL
  );

-- 7.4. Kits (também são produtos, com categoria própria ou marcador)
INSERT INTO categories (name, slug, icon_name, sort_order) VALUES
  ('Kits', 'kits', 'Gift', 0);

INSERT INTO products (supplier_id, category_id, name, slug, description, price, old_price, stock, badge) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    5,
    'Kit Iniciante Premium',
    'kit-iniciante-premium',
    'Tudo que você precisa em uma caixinha discreta. Inclui seda extra fina, cuia de silicone e isqueiro recarregável.',
    4990, 6200, 10, 'sale'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    5,
    'Kit Degustação Double Glass',
    'kit-degustacao-double-glass',
    'Para quem aprecia a pureza. Conta com duas sedas de vidro borossilicato e limpadores anatômicos inclusos.',
    3200, 3990, 10, NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    5,
    'Kit Heavy Grind',
    'kit-heavy-grind',
    'Triturador de policarbonato reforçado de 3 fases emparelhado com os melhores livretos King Size do mercado.',
    5500, 6900, 8, NULL
  );
