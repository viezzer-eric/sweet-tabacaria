# Database — Capivara Smoke

PostgreSQL rodando no Supabase.

## Setup

```bash
1. Crie um projeto em https://supabase.com
2. Vá em SQL Editor
3. Cole e execute `migrations/001_initial_schema.sql`
4. (Opcional) Cole e execute `migrations/002_storage_buckets.sql`
```

## Connection String

```
Host=db.xxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=xxx;SSL Mode=Require
```

## Migrations

| Arquivo | O que faz |
|---------|-----------|
| `001_initial_schema.sql` | Tabelas, índices, RLS, triggers, seed |
| `002_storage_buckets.sql` | Bucket de imagens + políticas |

## Reset (recriar tudo)

```sql
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- Depois rode a migration 001 novamente
```

## Estrutura

```
suppliers  ──▶  products  ──▶  product_images
                  │
categories ───────┤
                  │
users ◀── addresses
  │
  └──▶ orders ──▶ order_items ──▶ suppliers (comissão)
```
