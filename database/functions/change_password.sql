-- ══════════════════════════════════════════════════════════════
--  change_user_password — Altera senha (requer senha atual)
-- ══════════════════════════════════════════════════════════════

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

  -- Valida que a senha atual está correta (delega para auth)
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = v_user_id
      AND encrypted_password = crypt(current_password, encrypted_password)
  ) THEN
    RAISE EXCEPTION 'Senha atual incorreta';
  END IF;

  -- Atualiza senha
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  RETURN true;
END;
$$;
