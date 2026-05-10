## Funcionalidade: Comentário Automático (CTA) pós-publicação

Vou adicionar a opção de publicar um comentário CTA automaticamente após cada publicação de YouTube e Instagram.

### 1. Banco de dados (migration)

Adicionar colunas em `publication_targets` (uma por plataforma, pois o comentário é por publicação real):

- `auto_comment_enabled` boolean default false
- `auto_comment_text` text
- `auto_comment_delay_minutes` integer default 0  (0, 1, 5, 10)
- `auto_comment_status` text default 'disabled'  ('disabled' | 'pending' | 'posted' | 'failed')
- `auto_comment_platform_id` text
- `auto_comment_run_at` timestamptz
- `auto_comment_error` text
- `auto_comment_posted_at` timestamptz

Index: `(auto_comment_status, auto_comment_run_at)` para o cron pegar pendentes.

### 2. Frontend — `src/pages/PublisherHub.tsx`

Nova seção "Comentário automático" no formulário de agendamento, com:
- Switch "Publicar comentário automaticamente"
- Textarea editável (default: `👉 Faça o Diagnóstico Gratuito: painel-estoico.vercel.app`)
- Select de delay: Imediatamente / 1 min / 5 min / 10 min

Esses valores são salvos em cada `publication_target` criado.

### 3. Frontend — `src/pages/PublisherHistory.tsx`

Mostrar badge do status do comentário em cada target:
- Desativado / Aguardando / Publicado / Falha

### 4. Edge Function `publish-video` (modificação mínima)

Após publicar com sucesso, se `auto_comment_enabled = true`:
- Calcular `auto_comment_run_at = now() + delay`
- Setar `auto_comment_status = 'pending'`

### 5. Nova Edge Function `post-auto-comment`

Pega targets com `auto_comment_status='pending'` e `auto_comment_run_at <= now()`, e:
- **YouTube**: `POST commentThreads` com o `videoId` (= `platform_post_id`) usando o token armazenado.
- **Instagram**: `POST /{ig-media-id}/comments?message=...` com o token IG.
- Em sucesso: status `posted`, salva `auto_comment_platform_id`.
- Em falha: status `failed`, salva `auto_comment_error`.

### 6. Cron

Adicionar chamada à `post-auto-comment` no `cron-scheduler` existente (ou cron separado a cada minuto). Vou estender o cron-scheduler atual para invocar a nova função após processar publicações.

### Detalhes técnicos

- Comentário é por target (cada plataforma independente), não global na publicação — assim YouTube e Instagram têm status separados.
- Default text salvo no front; usuário pode editar antes de agendar.
- Sem pin/fixação.
- Estilo visual mantém tokens do design system existente (Switch, Textarea, Select shadcn).

### Arquivos afetados

- migration SQL (nova)
- `src/pages/PublisherHub.tsx` (UI + persist)
- `src/pages/PublisherHistory.tsx` (badge status)
- `supabase/functions/publish-video/index.ts` (marcar pending após sucesso)
- `supabase/functions/post-auto-comment/index.ts` (nova)
- `supabase/functions/cron-scheduler/index.ts` (invocar nova função)
- `supabase/config.toml` (registrar nova função)

Aprova para eu implementar?