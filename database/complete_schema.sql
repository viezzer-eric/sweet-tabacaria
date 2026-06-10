-- ═══════════════════════════════════════════════════════════════════════════════
--  CAPIVARA SMOKE — Schema Completo do Banco de Dados (PostgreSQL / Supabase)
--  Versão: 1.0.0
--  Autor: Equipe Capivara Smoke
--
--  ⚡ ARQUIVO ÚNICO — Execute uma vez no SQL Editor do Supabase
--  Cria: tabelas, enums, índices, RLS, triggers, funções, views, seed e storage.
--
--  Convenções:
--    - Preços em CENTAVOS (INT) → R$ 25,90 = 2590
--    - Timestamps com TIMESTAMPTZ (fuso horário UTC)
--    - Chaves primárias UUID (exceto categories que é SERIAL)
--    - Soft-delete via coluna `active` (nunca deletar registros)
--    - Nomes em snake_case (padrão PostgreSQL/Supabase)
-- ═══════════════════════════════════════════════════════════════════════════════

-- =============================================================================
--  1. EXTENSÕES + FUNÇÕES AUXILIARES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================================================
--  2. ENUMS
-- =============================================================================

-- Papéis dos usuários no sistema
CREATE TYPE user_role AS ENUM ('cliente', 'admin', 'fornecedor');

-- Ciclo de vida do pedido
CREATE TYPE order_status AS ENUM (
  'pending',     -- Aguardando pagamento
  'paid',        -- Pago (webhook confirmou)
  'preparing',   -- Em preparação
  'out',         -- Saiu para entrega
  'delivered',   -- Entregue
  'cancelled'    -- Cancelado
);

-- Tipo de cupom de desconto
CREATE TYPE coupon_type AS ENUM (
  'percentage',  -- Percentual (ex: 10% off)
  'fixed',       -- Valor fixo (ex: R$ 15 off)
  'free_shipping'-- Frete grátis
);


-- =============================================================================
--  3. TABELAS
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
--  3.1. FORNECEDORES
-- ──────────────────────────────────────────────────────────────────────────────
-- Permite que múltiplos fornecedores vendam na plataforma.
-- Cada fornecedor tem uma comissão por produto vendido.
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(200) UNIQUE NOT NULL,
  description     TEXT,
  phone           VARCHAR(20),
  email           VARCHAR(255),
  cnpj            VARCHAR(14) UNIQUE,
  logo_url        VARCHAR(500),
  banner_url      VARCHAR(500),
  address         VARCHAR(500),
  payment_methods VARCHAR(200),
  delivery_radius INT,
  min_order_value INT,
  delivery_time   INT,
  commission_pct  DECIMAL(5,2) NOT NULL DEFAULT 0.00
                  CHECK (commission_pct >= 0 AND commission_pct <= 100),
  is_verified     BOOLEAN DEFAULT false,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  suppliers                IS 'Fornecedores/parceiros da plataforma';
COMMENT ON COLUMN suppliers.user_id        IS 'Vínculo com o usuário dono do estabelecimento';
COMMENT ON COLUMN suppliers.commission_pct IS 'Percentual de comissão do fornecedor por venda (0–100)';
COMMENT ON COLUMN suppliers.is_verified    IS 'Fornecedor verificado pela plataforma';

-- ──────────────────────────────────────────────────────────────────────────────
--  3.2. CATEGORIAS
-- ──────────────────────────────────────────────────────────────────────────────
-- `icon_name` corresponde ao nome do componente Lucide React (ex: "Flame", "Gift").
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  icon_name   VARCHAR(50),
  active      BOOLEAN DEFAULT true,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  categories          IS 'Categorias de produtos (sedas, trituradores, kits...)';
COMMENT ON COLUMN categories.icon_name IS 'Nome do ícone Lucide React para exibição no frontend';

-- ──────────────────────────────────────────────────────────────────────────────
--  3.3. PRODUTOS
-- ──────────────────────────────────────────────────────────────────────────────
-- Core do sistema. Preços em centavos (INT). Busca full-text via TSVECTOR.
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

COMMENT ON TABLE  products             IS 'Produtos do catálogo (preços em centavos)';
COMMENT ON COLUMN products.cost_price  IS 'Preço de custo (centavos) – uso interno';
COMMENT ON COLUMN products.price       IS 'Preço de venda (centavos). R$ 25,90 = 2590';
COMMENT ON COLUMN products.old_price   IS 'Preço anterior para exibir desconto (centavos)';
COMMENT ON COLUMN products.badge       IS 'Badge exibido no card: "new" ou "sale"';

-- Coluna para full-text search (preenchida via trigger)
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- ──────────────────────────────────────────────────────────────────────────────
--  3.4. IMAGENS DOS PRODUTOS
-- ──────────────────────────────────────────────────────────────────────────────
-- URLs armazenadas no bucket `product-images` do Supabase Storage.
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         VARCHAR(200),
  is_primary  BOOLEAN DEFAULT false,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  product_images       IS 'Imagens dos produtos (bucket Supabase Storage)';
COMMENT ON COLUMN product_images.is_primary IS 'Primeira imagem a ser exibida no card';

-- ──────────────────────────────────────────────────────────────────────────────
--  3.5. USUÁRIOS
-- ──────────────────────────────────────────────────────────────────────────────
-- Estende o `auth.users` do Supabase com dados de negócio.
-- Um trigger (handle_new_user) cria automaticamente o registro aqui
-- quando alguém se cadastra via Supabase Auth.
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  phone         VARCHAR(20),
  cpf           VARCHAR(11) UNIQUE,
  birth_date    DATE,
  password_hash VARCHAR(500) NOT NULL DEFAULT '',
  role          user_role NOT NULL DEFAULT 'cliente',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  public.users           IS 'Usuários do sistema (autenticação própria, sem Supabase Auth)';
COMMENT ON COLUMN public.users.cpf       IS 'CPF do usuário (11 dígitos, validado na Receita Federal)';
COMMENT ON COLUMN public.users.birth_date IS 'Data de nascimento (validação de maioridade)';
COMMENT ON COLUMN public.users.password_hash IS 'Hash da senha (ASP.NET Core PasswordHasher)';
COMMENT ON COLUMN public.users.role      IS 'Papel no sistema: cliente, admin ou fornecedor';

-- ──────────────────────────────────────────────────────────────────────────────
--  3.6. ENDEREÇOS
-- ──────────────────────────────────────────────────────────────────────────────
-- Múltiplos endereços por usuário, com flag de endereço padrão.
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

COMMENT ON TABLE  addresses           IS 'Endereços de entrega dos usuários';

-- ──────────────────────────────────────────────────────────────────────────────
--  3.7. PEDIDOS
-- ──────────────────────────────────────────────────────────────────────────────
-- Valores em centavos. Status controlado por ENUM.
-- Dados do PIX (QR Code + copia-e-cola) salvos após pagamento.
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

COMMENT ON TABLE  orders               IS 'Pedidos realizados pelos clientes';
COMMENT ON COLUMN orders.subtotal      IS 'Soma dos produtos (centavos) antes do frete/desconto';
COMMENT ON COLUMN orders.coupon_code   IS 'Código do cupom aplicado (se houver)';

-- ──────────────────────────────────────────────────────────────────────────────
--  3.8. ITENS DO PEDIDO
-- ──────────────────────────────────────────────────────────────────────────────
-- Snapshots: product_name e product_price copiados no momento da compra.
-- supplier_id + commission_pct permitem calcular repasse automaticamente.
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

COMMENT ON TABLE  order_items              IS 'Itens individuais de cada pedido (snapshots)';
COMMENT ON COLUMN order_items.product_name IS 'Nome do produto no momento da compra (snapshot)';
COMMENT ON COLUMN order_items.commission_value IS 'Valor da comissão em centavos calculada no fechamento';

-- ──────────────────────────────────────────────────────────────────────────────
--  3.9. CUPONS DE DESCONTO
-- ──────────────────────────────────────────────────────────────────────────────
-- Cupons configuráveis pelo admin. Tipos: percentual, fixo ou frete grátis.
CREATE TABLE coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) UNIQUE NOT NULL,
  type            coupon_type NOT NULL,
  value           INT NOT NULL CHECK (value >= 0),
  description     VARCHAR(255),
  min_subtotal    INT DEFAULT 0 CHECK (min_subtotal >= 0),
  max_uses        INT DEFAULT NULL,
  used_count      INT DEFAULT 0 CHECK (used_count >= 0),
  active          BOOLEAN DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  coupons               IS 'Cupons de desconto configuráveis';
COMMENT ON COLUMN coupons.type          IS 'percentage (ex: 10), fixed (ex: 1500 = R$15), free_shipping';
COMMENT ON COLUMN coupons.value         IS 'Valor em centavos (fixed) ou percentual (percentage)';
COMMENT ON COLUMN coupons.min_subtotal  IS 'Valor mínimo do pedido em centavos para usar o cupom';
COMMENT ON COLUMN coupons.max_uses      IS 'Limite total de usos (NULL = ilimitado)';

-- ──────────────────────────────────────────────────────────────────────────────
--  3.10. FAVORITOS
-- ──────────────────────────────────────────────────────────────────────────────
-- Lista de desejos do usuário (coração nos cards de produto).
CREATE TABLE user_favorites (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

COMMENT ON TABLE user_favorites IS 'Produtos favoritados pelo usuário (wishlist)';


-- =============================================================================
--  4. ÍNDICES
-- =============================================================================

-- 4.1. Produtos
CREATE INDEX IF NOT EXISTS idx_products_supplier      ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category      ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active        ON products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_search        ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_created       ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price         ON products(price);

-- 4.2. Imagens
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- 4.3. Usuários
CREATE INDEX IF NOT EXISTS idx_users_role             ON public.users(role);

-- 4.4. Endereços
CREATE INDEX IF NOT EXISTS idx_addresses_user         ON addresses(user_id);

-- 4.5. Pedidos
CREATE INDEX IF NOT EXISTS idx_orders_user            ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created         ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_paid            ON orders(paid_at) WHERE paid_at IS NOT NULL;

-- 4.6. Itens
CREATE INDEX IF NOT EXISTS idx_order_items_order      ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_supplier   ON order_items(supplier_id);

-- 4.7. Cupons
CREATE INDEX IF NOT EXISTS idx_coupons_code           ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active         ON coupons(active) WHERE active = true;

-- 4.8. Favoritos
CREATE INDEX IF NOT EXISTS idx_favorites_user         ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product      ON user_favorites(product_id);


-- =============================================================================
--  5. ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- O Supabase aplica RLS automaticamente com base no JWT do usuário logado.
-- auth.uid() = ID do usuário autenticado
-- auth.jwt() ->> 'role' = papel do usuário (definido no raw_user_meta_data)

-- 5.1. Ativar RLS
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites     ENABLE ROW LEVEL SECURITY;

ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons            ENABLE ROW LEVEL SECURITY;

-- 5.2. Tabelas públicas (leitura liberada para todos, inclusive não-logados)
CREATE POLICY "Produtos visíveis para todos"
  ON products FOR SELECT USING (active = true);

CREATE POLICY "Categorias visíveis para todos"
  ON categories FOR SELECT USING (active = true);

CREATE POLICY "Fornecedores ativos visíveis para todos"
  ON suppliers FOR SELECT USING (active = true);

CREATE POLICY "Imagens visíveis para todos"
  ON product_images FOR SELECT USING (true);

CREATE POLICY "Cupons ativos visíveis para todos"
  ON coupons FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- 5.3. Dados do próprio usuário
CREATE POLICY "Usuário vê apenas próprio perfil"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Usuário edita próprio perfil"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Usuário gerencia próprios endereços"
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

CREATE POLICY "Usuário gerencia próprios favoritos"
  ON user_favorites FOR ALL
  USING (user_id = auth.uid());

-- 5.4. Admin (acesso total)
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

CREATE POLICY "Admin acesso total products"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acesso total categories"
  ON categories FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acesso total suppliers"
  ON suppliers FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acesso total coupons"
  ON coupons FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acesso total product_images"
  ON product_images FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin acesso total user_favorites"
  ON user_favorites FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');


-- =============================================================================
--  6. TRIGGERS
-- =============================================================================

-- 6.1. Sincronizar auth.users → public.users quando criar conta
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2. Atualizar updated_at automaticamente nas tabelas que têm essa coluna
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

-- 6.3. Atualizar search_vector dos produtos (full-text search)
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

-- 6.4. Incrementar used_count em coupons quando cupom for usado
-- Nota: a função create_order já gerencia isso manualmente


-- =============================================================================
--  7. FUNÇÕES (STORED PROCEDURES)
-- =============================================================================

-- 7.1. Criar Pedido (chamado pelo frontend via supabase.rpc)
-- Uso: SELECT * FROM create_order('address_uuid', '[{"product_id":"...", "qty":1}]', 'CUPOM10')
CREATE OR REPLACE FUNCTION public.create_order(
  p_address_id UUID,
  p_items      JSONB,
  p_coupon_code VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id   UUID;
  v_order_id  UUID;
  v_subtotal  INT := 0;
  v_discount  INT := 0;
  v_shipping  INT := 2590; -- R$ 25,90 fixo (MVP)
  v_total     INT;
  v_item      JSONB;
  v_product   RECORD;
  v_supplier  RECORD;
  v_commission INT;
  v_coupon    RECORD;
BEGIN
  -- Validar usuário logado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Validar endereço
  IF NOT EXISTS (SELECT 1 FROM addresses WHERE id = p_address_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Endereço inválido';
  END IF;

  -- Criar pedido (status pending)
  v_order_id := gen_random_uuid();

  INSERT INTO orders (id, user_id, address_id, status, subtotal, discount, shipping, total)
  VALUES (v_order_id, v_user_id, p_address_id, 'pending', 0, 0, 0, 0);

  -- Processar cada item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item ->> 'product_id')::UUID
      AND active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto % não encontrado', (v_item ->> 'product_id');
    END IF;

    IF v_product.stock < (v_item ->> 'qty')::INT THEN
      RAISE EXCEPTION 'Estoque insuficiente para %', v_product.name;
    END IF;

    -- Buscar comissão do fornecedor
    SELECT commission_pct INTO v_supplier
    FROM suppliers WHERE id = v_product.supplier_id;

    v_commission := ROUND((v_item ->> 'qty')::INT * v_product.price * COALESCE(v_supplier.commission_pct, 0) / 100);

    -- Inserir item
    INSERT INTO order_items (order_id, product_id, supplier_id, product_name, product_price, quantity, subtotal, commission_pct, commission_value)
    VALUES (
      v_order_id,
      v_product.id,
      v_product.supplier_id,
      v_product.name,
      v_product.price,
      (v_item ->> 'qty')::INT,
      (v_item ->> 'qty')::INT * v_product.price,
      v_supplier.commission_pct,
      v_commission
    );

    -- Decrementar estoque
    UPDATE products SET stock = stock - (v_item ->> 'qty')::INT
    WHERE id = v_product.id;

    v_subtotal := v_subtotal + ((v_item ->> 'qty')::INT * v_product.price);
  END LOOP;

  -- Aplicar cupom (se houver) — busca na tabela de cupons
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = UPPER(p_coupon_code)
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR used_count < max_uses);

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupom inválido ou expirado';
    END IF;

    IF v_subtotal < v_coupon.min_subtotal THEN
      RAISE EXCEPTION 'Valor mínimo para este cupom: R$ %', (v_coupon.min_subtotal / 100)::TEXT;
    END IF;

    CASE v_coupon.type
      WHEN 'percentage' THEN
        v_discount := ROUND(v_subtotal * v_coupon.value / 100);
      WHEN 'fixed' THEN
        v_discount := LEAST(v_coupon.value, v_subtotal);
      WHEN 'free_shipping' THEN
        v_shipping := 0;
    END CASE;

    -- Incrementar contagem de uso
    UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
  END IF;

  -- Calcular total
  v_total := v_subtotal - v_discount + v_shipping;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- Atualizar pedido com valores finais
  UPDATE orders SET
    subtotal = v_subtotal,
    discount = v_discount,
    shipping = v_shipping,
    total = v_total,
    coupon_code = UPPER(p_coupon_code)
  WHERE id = v_order_id;

  -- Retornar pedido criado
  RETURN (
    SELECT jsonb_build_object(
      'id', o.id,
      'total', o.total,
      'subtotal', o.subtotal,
      'discount', o.discount,
      'shipping', o.shipping,
      'status', o.status
    )
    FROM orders o WHERE o.id = v_order_id
  );
END;
$$;

-- 7.2. Alterar senha do usuário
-- Uso: SELECT * FROM change_user_password('senha_atual', 'nova_senha')
CREATE OR REPLACE FUNCTION public.change_user_password(
  current_password TEXT,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = v_user_id
      AND encrypted_password = crypt(current_password, encrypted_password)
  ) THEN
    RAISE EXCEPTION 'Senha atual incorreta';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

-- 7.3. Obter métricas do dashboard (admin)
-- Uso: SELECT * FROM get_dashboard_metrics()
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  today_start TIMESTAMPTZ := date_trunc('day', now());
BEGIN
  -- Verificar se é admin
  IF auth.jwt() ->> 'role' != 'admin' THEN
    RAISE EXCEPTION 'Acesso restrito a administradores';
  END IF;

  SELECT jsonb_build_object(
    'todayOrders',  (SELECT COUNT(*) FROM orders WHERE created_at >= today_start),
    'todayRevenue', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE paid_at >= today_start),
    'pending',      (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    'preparing',    (SELECT COUNT(*) FROM orders WHERE status = 'preparing'),
    'out',          (SELECT COUNT(*) FROM orders WHERE status = 'out'),
    'monthRevenue', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE paid_at >= date_trunc('month', now())),
    'totalProducts',(SELECT COUNT(*) FROM products WHERE active = true),
    'totalUsers',   (SELECT COUNT(*) FROM public.users),
    'lowStock',     (SELECT COUNT(*) FROM products WHERE active = true AND stock <= 5)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 7.4. Cancelar pedido (usuário ou admin)
-- Uso: SELECT * FROM cancel_order('order_uuid')
CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order   RECORD;
  v_item    RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar pedido
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  -- Validar: próprio usuário OU admin
  IF v_order.user_id != v_user_id AND auth.jwt() ->> 'role' != 'admin' THEN
    RAISE EXCEPTION 'Sem permissão para cancelar este pedido';
  END IF;

  -- Só pode cancelar se estiver em pending ou paid
  IF v_order.status NOT IN ('pending', 'paid') THEN
    RAISE EXCEPTION 'Pedido já está em % e não pode ser cancelado', v_order.status;
  END IF;

  -- Restaurar estoque
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    UPDATE products SET stock = stock + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  -- Atualizar status
  UPDATE orders SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$$;


-- =============================================================================
--  8. VIEWS
-- =============================================================================

-- 8.1. Produtos com preços formatados e imagem principal
CREATE OR REPLACE VIEW v_products AS
SELECT
  p.id,
  p.supplier_id,
  p.category_id,
  p.name,
  p.slug,
  p.description,
  p.cost_price,
  p.price,
  p.old_price,
  ROUND(p.price / 100.0, 2) AS price_reais,
  ROUND(p.old_price / 100.0, 2) AS old_price_reais,
  CASE
    WHEN p.old_price IS NOT NULL AND p.old_price > 0
    THEN ROUND((1 - p.price::NUMERIC / p.old_price) * 100, 0)
    ELSE NULL
  END AS discount_pct,
  p.stock,
  p.badge,
  c.name AS category_name,
  c.slug AS category_slug,
  c.icon_name AS category_icon,
  s.name AS supplier_name,
  (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
  p.created_at
FROM products p
JOIN categories c ON c.id = p.category_id
JOIN suppliers s ON s.id = p.supplier_id
WHERE p.active = true;

COMMENT ON VIEW v_products IS 'Produtos ativos com joins, preços em reais e imagem principal';

-- 8.2. Pedidos com item count e nome do usuário
CREATE OR REPLACE VIEW v_orders AS
SELECT
  o.id,
  o.user_id,
  u.name AS user_name,
  u.phone AS user_phone,
  o.address_id,
  o.status,
  o.subtotal,
  o.discount,
  o.shipping,
  o.total,
  ROUND(o.total / 100.0, 2) AS total_reais,
  o.coupon_code,
  o.payment_method,
  o.paid_at,
  o.created_at,
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
  (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS total_items_qty
FROM orders o
JOIN public.users u ON u.id = o.user_id;

COMMENT ON VIEW v_orders IS 'Pedidos com dados do usuário e resumo de itens';

-- 8.3. Dashboard do admin: métricas rápidas
CREATE OR REPLACE VIEW v_dashboard AS
SELECT
  (SELECT COUNT(*) FROM orders WHERE created_at >= date_trunc('day', now())) AS today_orders,
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE paid_at >= date_trunc('day', now())) AS today_revenue_centavos,
  (SELECT COALESCE(SUM(total), 0) / 100.0 FROM orders WHERE paid_at >= date_trunc('day', now())) AS today_revenue_reais,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'preparing') AS preparing_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'out') AS out_for_delivery,
  (SELECT COUNT(*) FROM products WHERE active = true AND stock <= 5) AS low_stock_products,
  (SELECT COUNT(*) FROM products WHERE active = true) AS total_products,
  (SELECT COUNT(*) FROM public.users) AS total_users,
  (SELECT COALESCE(SUM(total), 0) / 100.0 FROM orders WHERE paid_at >= date_trunc('month', now())) AS month_revenue_reais;

COMMENT ON VIEW v_dashboard IS 'Métricas do dashboard administrativo';

-- 8.4. Comissões por fornecedor (para relatórios financeiros)
CREATE OR REPLACE VIEW v_supplier_commissions AS
SELECT
  s.id AS supplier_id,
  s.name AS supplier_name,
  COUNT(DISTINCT oi.id) AS items_sold,
  SUM(oi.quantity) AS total_quantity,
  SUM(oi.subtotal) AS gross_sales_centavos,
  SUM(oi.commission_value) AS total_commission_centavos,
  ROUND(SUM(oi.commission_value) / 100.0, 2) AS total_commission_reais,
  DATE_TRUNC('month', o.created_at) AS reference_month
FROM order_items oi
JOIN suppliers s ON s.id = oi.supplier_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('cancelled')
GROUP BY s.id, s.name, DATE_TRUNC('month', o.created_at);

COMMENT ON VIEW v_supplier_commissions IS 'Comissões agregadas por fornecedor e mês';


-- =============================================================================
--  9. SEED DATA (DADOS INICIAIS)
-- =============================================================================

-- ---------------------------------------------------------------------------
--  9.1. Fornecedor padrão (loja própria)
-- ---------------------------------------------------------------------------
INSERT INTO suppliers (id, name, slug, phone, email, commission_pct)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Capivara Smoke (Loja Própria)',
    'capivara-smoke',
    '(11) 97651-9275',
    'contato@capivarasmoke.com.br',
  0.00
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
--  9.2. Categorias
-- ---------------------------------------------------------------------------
INSERT INTO categories (name, slug, icon_name, sort_order) VALUES
  ('Kits',          'kits',         'Gift',     0),
  ('Sedas',         'sedas',        'FileText', 1),
  ('Trituradores',  'trituradores', 'Settings', 2),
  ('Isqueiros',     'isqueiros',    'Flame',    3),
  ('Acessórios',    'acessorios',   'Soup',     4)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
--  9.3. Produtos
-- ---------------------------------------------------------------------------
INSERT INTO products (supplier_id, category_id, name, slug, description, price, old_price, stock, badge)
VALUES
  -- Sedas (category_id = 2)
  (
    '00000000-0000-0000-0000-000000000001', 2,
    'Seda King Size Extra Fina',
    'seda-king-size-extra-fina',
    'Seda premium extra fina para uma queima lenta e uniforme. Pacote com 24 unidades.',
    1200, 1500, 50, 'sale'
  ),
  (
    '00000000-0000-0000-0000-000000000001', 2,
    'Seda de Vidro Borossilicato',
    'seda-vidro-borossilicato',
    'Seda de vidro borossilicato reutilizável. Fácil de limpar e econômica.',
    1800, NULL, 15, NULL
  ),
  -- Trituradores (category_id = 3)
  (
    '00000000-0000-0000-0000-000000000001', 3,
    'Triturador de Policarbonato',
    'triturador-policarbonato',
    'Triturador de policarbonato reforçado com 3 fases e imã coletor.',
    3500, NULL, 20, 'new'
  ),
  -- Isqueiros (category_id = 4)
  (
    '00000000-0000-0000-0000-000000000001', 4,
    'Isqueiro Recarregável Premium',
    'isqueiro-recargavel-premium',
    'Isqueiro recarregável a gás com chama ajustável. Design slim.',
    990, NULL, 100, NULL
  ),
  -- Acessórios (category_id = 5)
  (
    '00000000-0000-0000-0000-000000000001', 5,
    'Cuia de Silicone Eco',
    'cuia-silicone-eco',
    'Cuia de silicone ecológico atóxico. Disponível em 3 cores.',
    2200, NULL, 30, NULL
  ),
  -- Kits (category_id = 1)
  (
    '00000000-0000-0000-0000-000000000001', 1,
    'Kit Iniciante Premium',
    'kit-iniciante-premium',
    'Tudo que você precisa em uma caixinha discreta. Inclui seda extra fina, cuia de silicone e isqueiro recarregável.',
    4990, 6200, 10, 'sale'
  ),
  (
    '00000000-0000-0000-0000-000000000001', 1,
    'Kit Degustação Double Glass',
    'kit-degustacao-double-glass',
    'Para quem aprecia a pureza. Conta com duas sedas de vidro borossilicato e limpadores anatômicos inclusos.',
    3200, 3990, 10, NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001', 1,
    'Kit Heavy Grind',
    'kit-heavy-grind',
    'Triturador de policarbonato reforçado de 3 fases emparelhado com os melhores livretos King Size do mercado.',
    5500, 6900, 8, NULL
  );

-- ---------------------------------------------------------------------------
--  9.4. Cupons iniciais
-- ---------------------------------------------------------------------------
INSERT INTO coupons (code, type, value, description, min_subtotal, max_uses)
VALUES
  ('CAPIVARA10', 'percentage',     10, '10% de desconto em qualquer pedido',    0,    100),
  ('BEMVINDO',   'fixed',        1500, 'R$ 15 de desconto (mínimo R$ 30)',   3000,  NULL),
  ('FRETEGRATIS','free_shipping',   0, 'Frete grátis (mínimo R$ 50)',        5000,  50)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
--  9.5. Criar admin (via Supabase Auth)
--   NOTA: Para criar o admin, use o dashboard do Supabase ou a API:
--     supabase.auth.signUp({ email, password, options: { data: { role: 'admin' } } })
--   Depois execute manualmente:
--     UPDATE public.users SET role = 'admin' WHERE email = 'admin@capivarasmoke.com.br';
-- ---------------------------------------------------------------------------


-- =============================================================================
--  10. STORAGE (Bucket de imagens dos produtos)
-- =============================================================================

-- Bucket público para imagens de produtos (5MB max, JPEG/PNG/WebP)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images');

-- Política: qualquer um pode ver imagens
DROP POLICY IF EXISTS "Imagens públicas" ON storage.objects;
CREATE POLICY "Imagens públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Política: admin pode fazer upload
DROP POLICY IF EXISTS "Admin pode enviar imagens" ON storage.objects;
CREATE POLICY "Admin pode enviar imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.jwt() ->> 'role' = 'admin'
  );

-- Política: admin pode deletar imagens
DROP POLICY IF EXISTS "Admin pode deletar imagens" ON storage.objects;
CREATE POLICY "Admin pode deletar imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.jwt() ->> 'role' = 'admin'
  );


-- ═══════════════════════════════════════════════════════════════════════════════
--  FIM DO SCRIPT — CAPIVARA SMOKE SCHEMA v1.0.0
-- ═══════════════════════════════════════════════════════════════════════════════

