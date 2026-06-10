-- ══════════════════════════════════════════════════════════════
--  CAPIVARA SMOKE — Storage Buckets (rodar no SQL Editor)
-- ══════════════════════════════════════════════════════════════

-- Bucket para imagens de produtos (acesso público de leitura)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Política: qualquer um pode ver imagens
CREATE POLICY "Imagens públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Política: apenas admin pode fazer upload
CREATE POLICY "Admin pode enviar imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.jwt() ->> 'role' = 'admin'
  );

-- Política: admin pode deletar imagens
CREATE POLICY "Admin pode deletar imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.jwt() ->> 'role' = 'admin'
  );
