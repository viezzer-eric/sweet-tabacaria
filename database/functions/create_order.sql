-- ══════════════════════════════════════════════════════════════
--  create_order — Cria pedido com validação de estoque
--  Uso: SELECT * FROM create_order('address_uuid', '[{"product_id":"...", "qty":1}]', 'CUPOM10')
-- ══════════════════════════════════════════════════════════════

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
BEGIN
  -- 1. Validar usuário logado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- 2. Validar endereço
  IF NOT EXISTS (SELECT 1 FROM addresses WHERE id = p_address_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Endereço inválido';
  END IF;

  -- 3. Criar pedido (status pending)
  v_order_id := gen_random_uuid();

  INSERT INTO orders (id, user_id, address_id, status, subtotal, discount, shipping, total)
  VALUES (v_order_id, v_user_id, p_address_id, 'pending', 0, 0, 0, 0);

  -- 4. Processar cada item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item ->> 'product_id')::UUID
      AND active = true
    FOR UPDATE; -- lock otimista

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

  -- 5. Aplicar cupom (se houver)
  IF p_coupon_code IS NOT NULL THEN
    -- Lógica de cupom: S WEET10 = 10%, BEMVINDO = R$15, FRETE0 = frete grátis
    CASE p_coupon_code
      WHEN 'CAPIVARA10' THEN
        v_discount := ROUND(v_subtotal * 0.10);
      WHEN 'BEMVINDO' THEN
        v_discount := LEAST(1500, v_subtotal); -- R$ 15,00
      WHEN 'FRETE0' THEN
        v_shipping := 0;
      ELSE
        RAISE EXCEPTION 'Cupom inválido';
    END CASE;
  END IF;

  -- 6. Calcular total
  v_total := v_subtotal - v_discount + v_shipping;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- 7. Atualizar pedido com valores finais
  UPDATE orders SET
    subtotal = v_subtotal,
    discount = v_discount,
    shipping = v_shipping,
    total = v_total,
    coupon_code = p_coupon_code
  WHERE id = v_order_id;

  -- 8. Retornar pedido criado
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
