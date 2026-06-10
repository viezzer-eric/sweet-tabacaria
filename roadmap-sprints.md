# 🗺️ Roadmap MVP — Capivara Smoke
## 7 Sprints × 2 semanas — Histórias e Tarefas

---

## ✅ Sprint 1 — Scaffold .NET + API de Produtos

### H1.1 — Como visitante, quero ver a lista de produtos para navegar pelo catálogo

**Tarefas:**
- [ ] Criar solution `Sweet.sln` com projetos: `Sweet.API`, `Sweet.Application`, `Sweet.Domain`, `Sweet.Infrastructure`
- [ ] Configurar `Sweet.API` (Program.cs, middleware, CORS, Swagger, Serilog)
- [ ] Criar `Sweet.Application/Products/Queries/GetProductsQuery.cs` (MediatR)
- [ ] Criar `Sweet.Application/Products/Queries/GetProductBySlugQuery.cs`
- [ ] Criar `Sweet.Application/Products/Mappings/ProductProfile.cs` (AutoMapper)
- [ ] Criar `Sweet.Application/Products/DTOs/ProductDto.cs`, `ProductListDto.cs`
- [ ] Criar `Sweet.API/Controllers/ProductsController.cs`
- [ ] Finalizar mappings EF Core em `Sweet.Infrastructure/Data/Mappings/` (Fluent API para todas as 10 entidades)
- [ ] Configurar `DbContext` com `Npgsql.EntityFrameworkCore.PostgreSQL`
- [ ] Criar `DbInitializer` para rodar seed no startup
- [ ] `docker-compose.yml` com PostgreSQL 16 + Redis 7

### H1.2 — Como visitante, quero buscar produtos por nome/descrição

**Tarefas:**
- [ ] Implementar full-text search via `search_vector` + `to_tsquery('portuguese', ...)`
- [ ] Adicionar filtros: `?search=`, `?category=`, `?minPrice=`, `?maxPrice=`, `?sort=`
- [ ] Adicionar paginação: `?page=1&limit=20`

### H1.3 — Como visitante, quero ver as categorias no menu

**Tarefas:**
- [ ] `GET /api/categories` — retorna categorias ativas ordenadas por `sort_order`

### H1.4 — Técnica: infraestrutura

**Tarefas:**
- [ ] Configurar `IDistributedCache` com Redis (container docker)
- [ ] Implementar `CacheService` com TTL configurável
- [ ] `ProductService` com padrão Cache-Aside (cache → banco → cache)

---

## ✅ Sprint 2 — Autenticação JWT

### H2.1 — Como visitante, quero me cadastrar para fazer pedidos

**Tarefas:**
- [ ] `POST /api/auth/register` — cria usuário no Supabase Auth + insere em `public.users`
- [ ] Validar email único, senha com mínimo 8 caracteres
- [ ] Enviar email de confirmação (Supabase Auth gerencia)

### H2.2 — Como usuário, quero fazer login para acessar meus dados

**Tarefas:**
- [ ] `POST /api/auth/login` — autentica no Supabase, retorna JWT + refresh token
- [ ] `POST /api/auth/refresh` — renova o JWT
- [ ] `POST /api/auth/logout` — invalida refresh token
- [ ] Configurar `JwtMiddleware` para validar token em todas as requests

### H2.3 — Como usuário, quero ver meu perfil

**Tarefas:**
- [ ] `GET /api/auth/me` — retorna dados do `public.users`
- [ ] Frontend: conectar `AuthContext` ao Supabase SDK (`@supabase/supabase-js`)
- [ ] Frontend: substituir mock de login por tela real de login/cadastro
- [ ] Frontend: tratar erro 401 → redirect para `/login`

### H2.4 — Técnica: segurança

**Tarefas:**
- [ ] Rate limiting no login (5 tentativas / minuto)
- [ ] `AuthorizeAttribute` customizado para validar role (cliente, admin)
- [ ] Helmet + CORS restrito em produção

---

## ✅ Sprint 3 — Endereços + Checkout

### H3.1 — Como usuário, quero gerenciar meus endereços de entrega

**Tarefas:**
- [ ] `GET /api/addresses` — listar endereços do usuário
- [ ] `POST /api/addresses` — criar novo endereço
- [ ] `PUT /api/addresses/{id}` — editar endereço
- [ ] `DELETE /api/addresses/{id}` — remover endereço
- [ ] `PATCH /api/addresses/{id}/default` — marcar como padrão
- [ ] Validar CEP via API pública (ViaCEP) — preencher rua/bairro/cidade automaticamente
- [ ] Frontend: modal de endereço com formulário + máscara de CEP

### H3.2 — Como usuário, quero finalizar meu pedido

**Tarefas:**
- [ ] `POST /api/orders` — criar pedido (chama RPC `create_order` do PostgreSQL)
- [ ] Validar estoque antes de criar
- [ ] Calcular frete (fixo R$ 25,90 no MVP)
- [ ] Aplicar cupom de desconto
- [ ] `GET /api/orders` — histórico de pedidos do usuário
- [ ] `GET /api/orders/{id}` — detalhe do pedido com itens
- [ ] Frontend: tela de checkout (selecionar endereço + resumo + cupom)
- [ ] Frontend: tela de confirmação pós-pedido

### H3.3 — Como usuário, quero remover itens do carrinho

**Tarefas:**
- [ ] Frontend: `CartDrawer` com lista de itens + botão remover
- [ ] Frontend: atualizar `CartContext` com persistência local (localStorage)

### H3.4 — Técnica: validação

**Tarefas:**
- [ ] FluentValidation nos commands (`CreateOrderCommand`, `SaveAddressCommand`)
- [ ] Tratamento global de exceções (`ExceptionMiddleware`)
- [ ] Logs estruturados (Serilog + Seq/Elastic)

---

## ✅ Sprint 4 — Pagamento PIX (Mercado Pago)

### H4.1 — Como usuário, quero pagar com PIX

**Tarefas:**
- [ ] Configurar integração Mercado Pago (`SDK` ou HTTP direto)
- [ ] `POST /api/payments/create-pix` — gera QR Code dinâmico
- [ ] Salvar `pix_qr_code` e `pix_copy_paste` no pedido
- [ ] Frontend: exibir QR Code + botão "Copiar código"
- [ ] Frontend: polling a cada 5s do status do pedido (via `GET /api/orders/{id}`)
- [ ] Toast de sucesso quando pagamento confirmar

### H4.2 — Como admin, quero receber confirmação de pagamento automática

**Tarefas:**
- [ ] `POST /api/webhooks/mercadopago` — endpoint público (secret validation)
- [ ] Validar assinatura do webhook (header `X-Signature`)
- [ ] Atualizar status: `pending → paid` + salvar `paid_at`
- [ ] Idempotência: ignorar webhooks duplicados (por `payment_id`)

### H4.3 — Como admin, quero estornar pedidos manualmente

**Tarefas:**
- [ ] `POST /api/admin/orders/{id}/refund` — estorno via API Mercado Pago
- [ ] Atualizar estoque (restaurar itens)

---

## ✅ Sprint 5 — Admin + Tempo Real

### H5.1 — Como admin, quero ver o dashboard com métricas

**Tarefas:**
- [ ] `GET /api/admin/metrics` — usar view `v_dashboard`
- [ ] Frontend: cards de métricas (pedidos hoje, receita, pending, low stock)

### H5.2 — Como admin, quero gerenciar pedidos

**Tarefas:**
- [ ] `GET /api/admin/orders` — listar com filtros (status, data, search)
- [ ] `PATCH /api/admin/orders/{id}/status` — atualizar status
- [ ] Frontend: tabela com ações por status (confirmar, preparar, despachar)

### H5.3 — Como admin, quero notificações em tempo real dos pedidos

**Tarefas:**
- [ ] Configurar SignalR Hub `/hub/orders`
- [ ] Notificar admin quando novo pedido chegar
- [ ] Notificar cliente quando status mudar
- [ ] Frontend: badge no header com contagem de pedidos pendentes
- [ ] Frontend: toast "Seu pedido #123 foi atualizado para Em Preparação"

### H5.4 — Técnica: SignalR

**Tarefas:**
- [ ] `Microsoft.AspNetCore.SignalR` no backend
- [ ] `@microsoft/signalr` no frontend
- [ ] Grupos por `userId` (cliente recebe só seus pedidos)
- [ ] Grupo `admin` (todos os admins recebem todos pedidos)

---

## ✅ Sprint 6 — Perfil + Busca + Favoritos

### H6.1 — Como usuário, quero editar meu perfil

**Tarefas:**
- [ ] `PUT /api/profile` — editar nome, telefone
- [ ] `POST /api/profile/change-password` — alterar senha (chama RPC)
- [ ] Frontend: tela de perfil com formulário editável

### H6.2 — Como usuário, quero favoritar produtos

**Tarefas:**
- [ ] `GET /api/favorites` — listar favoritos
- [ ] `POST /api/favorites/{productId}` — adicionar
- [ ] `DELETE /api/favorites/{productId}` — remover
- [ ] Frontend: coração preenchido/vazio nos cards de produto

### H6.3 — Como visitante, quero busca completa com filtros

**Tarefas:**
- [ ] Conectar `SearchResults.jsx` à API real (`GET /api/products`)
- [ ] Sidebar de filtros: faixa de preço (slider), categoria (checkboxes)
- [ ] Ordenação: menor preço, maior preço, mais recentes
- [ ] Placeholder de imagem quando `primary_image` for null

### H6.4 — Técnica: imagens

**Tarefas:**
- [ ] Admin: upload de imagens para o bucket `product-images` (via Supabase Storage)
- [ ] Gerar URL pública assinada (ou usar URL pública direta)
- [ ] Redimensionar imagens no upload (sharp/bucket transform)

---

## ✅ Sprint 7 — Deploy + CI/CD + Homologação

### H7.1 — Como dev, quero deploy automatizado

**Tarefas:**
- [ ] Vercel: conectar repositório, build automático, domínio customizado
- [ ] Railway/Azure: deploy da .NET API + PostgreSQL + Redis
- [ ] Dockerfile para a API (.NET 8)
- [ ] GitHub Actions: CI (lint + build + test) em todo push
- [ ] GitHub Actions: CD (deploy automático no merge para main)

### H7.2 — Como dev, quero ambiente de produção configurado

**Tarefas:**
- [ ] Variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `MP_ACCESS_TOKEN`
- [ ] SSL/TLS automático (Vercel + Railway fazem)
- [ ] Backup automático do PostgreSQL (Railway snapshot diário)

### H7.3 — Como dev, quero monitoramento

**Tarefas:**
- [ ] Sentry: frontend + backend (error tracking)
- [ ] Health checks: `GET /health` (banco, redis, mercadopago)
- [ ] Logs centralizados (Serilog + Seq Cloud)

### H7.4 — Como usuário, quero performance aceitável

**Tarefas:**
- [ ] Testes de carga com k6: 100 usuários simultâneos
- [ ] Lighthouse: ≥ 90 em Performance, Accessibility, SEO
- [ ] Lazy loading de imagens nos cards de produto

### H7.5 — Como dev, quero testes

**Tarefas:**
- [ ] Testes unitários: `Sweet.UnitTests` (domain + application)
- [ ] Testes de integração: `Sweet.IntegrationTests` (API + PostgreSQL testcontainer)
- [ ] Mínimo 70% de cobertura

---

## 📊 Sumário

| Sprint | Histórias | Tarefas | Entrega |
|--------|-----------|---------|---------|
| **1** Scaffold + Produtos | 4 | ~18 | API de catálogo rodando |
| **2** Autenticação | 4 | ~12 | Login real no frontend |
| **3** Endereços + Checkout | 4 | ~16 | Usuário finaliza pedido |
| **4** PIX Mercado Pago | 3 | ~10 | Pagamento real no ar |
| **5** Admin + SignalR | 4 | ~12 | Admin dashboard + tempo real |
| **6** Perfil + Busca | 4 | ~10 | Experiência completa |
| **7** Deploy + CI/CD | 5 | ~12 | MVP em produção |
| **Total** | **28** | **~90** | **14 semanas** |
