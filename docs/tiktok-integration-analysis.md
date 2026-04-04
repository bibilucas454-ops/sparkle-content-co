# TikTok API Integration - Análise Completa

## FASE 1 — PESQUISA

### ✅ É POSSÍVEL?

| Recurso | Status | Notas |
|---------|--------|-------|
| Conectar via OAuth | ✅ SIM | Login Kit v2 |
| Publicar vídeo | ✅ SIM | Content Posting API |
| Publicar imagens/fotos | ✅ SIM | Suportado desde 2024 |
| Carrossel | ⚠️ PARCIAL | Apenas fotos, não carrossel de vídeos |
| Agendar posts | ⚠️ LIMITAÇÃO | Não há API de agendamento nativa |
| Refresh tokens | ✅ SIM | Refresh a cada 24h |

### Endpoints Principais

**OAuth:**
- `POST https://open.tiktokapis.com/v2/oauth/token/` - Obter token
- `POST https://open.tiktokapis.com/v2/oauth/token/` - Refresh token

**Content Posting:**
- `POST /v2/post/publish/inbox/video/init/` - Inicializar upload de vídeo
- `POST /v2/post/publish/content/init/` - Postar diretamente ou fotos
- `GET /v2/post/publish/video/info/` - Verificar status

### Escopos OAuth Necessários

```
video.upload     - Upload como rascunho
video.publish    - Postar diretamente
user.info.basic  - Ler perfil do usuário
```

### Rate Limits

- **6 requests/minuto** por user access token
- Máximo **5 pending shares** em 24h por usuário
- Access token expira em **24 horas**
- Refresh token expira em **365 dias**

### Limitações Identificadas

1. **Aprovação obrigatória** - App precisa ser aprovado para produção
2. **Sem agendamento nativo** - Não há endpoint para agendar
3. **Vídeo vai para "Rascunho"** - Com `video.upload`, usuário precisa postar manualmente
4. **Verificação de URL** - Para `PULL_FROM_URL`, precisa verificar domínio
5. **5 pending shares/dia** - Limite de vídeos pendentes via API

---

## FASE 2 — ARQUITETURA

### Fluxo OAuth TikTok

```
Frontend                    Edge Function                  TikTok API
    |                            |                            |
    |-- OAuth Start ------------>|                            |
    |                            |-- redirect to TikTok ---->|
    |<-- return auth URL ---------|                            |
    |                            |                            |
    |  (user authorizes)         |                            |
    |                            |                            |
    |<-- callback with code -----|<-- user returns -----------|
    |                            |                            |
    |--- exchange code -------->|                            |
    |                            |-- POST /oauth/token ----->|
    |                            |<-- access_token ---------|
    |                            |                            |
    |<-- tokens -----------------|                            |
```

### Estrutura de Dados (Supabase)

```sql
-- Tabela: social_tokens (existente)
-- Adicionar plataforma 'tiktok'
-- Campos já existem: access_token_encrypted, refresh_token_encrypted, etc.
```

### Edge Functions Necessárias

| Função | Descrição |
|--------|-----------|
| `tiktok-auth-start` | Inicia OAuth TikTok |
| `tiktok-auth-callback` | Processa callback, troca code por tokens |
| `tiktok-refresh-token` | Refresh token expirado |
| `tiktok-upload-video` | Upload de vídeo |
| `tiktok-publish` | Publica vídeo (direct post) |
| `tiktok-check-status` | Verifica status do post |

---

## FASE 3 — IMPLEMENTAÇÃO DETALHADA

### Variáveis de Ambiente Necessárias

```env
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_APP_ID=your_app_id
```

### Configuração OAuth (config.toml)

```toml
[functions.tiktok-auth-start]
verify_jwt = false

[functions.tiktok-auth-callback]
verify_jwt = false
```

---

## FASE 4 — LIMITAÇÕES E RISCOS

### O que NÃO é possível fazer

| Item | Motivo |
|------|--------|
| **Agendar posts** | TikTok não tem API de agendamento |
| **Postar carrossel de vídeos** | API só suporta 1 vídeo ou múltiplas fotos |
| **Upload direto de arquivo** | Só via URL (precisa verificar domínio) |
| **Analytics via API** | Display API limitada |
| **Postar stories** | Não suportado pela Content Posting API |

### Restrições do TikTok

1. **Aprovação obrigatória** - App precisa de aprovação TikTok para produção
2. **Sandbox limitado** - Apenas contas de desenvolvedor
3. **6 req/min** - Rate limit por token
4. **5 pending shares/dia** - Limite de vídeos pendentes
5. **24h token** - Access token expira em 24h

### Diferença Sandbox vs Produção

- **Sandbox**: Apenas contas de desenvolvedor, testes limitados
- **Produção**: Requer aprovação, todas as funcionalidades

### Alternativas para Agendamento

Como TikTok não tem API de agendamento:
1. **Cron job** externo que chama a API no horário correto
2. **Notificação** ao usuário para postar manualmente
3. **Rascunho** (`video.upload`) para completar depois no app TikTok

---

## FASE 5 — IMPLEMENTAÇÃO NO SAAS

### Integração no PublisherHub

```tsx
// Adicionar botão TikTok em PublisherAccounts.tsx
<Button 
  onClick={() => connectPlatform('tiktok')}
  variant="outline"
>
  <Video className="mr-2" />
  Conectar TikTok
</Button>
```

### Fluxo no Publisher Hub

1. **Conectar** → OAuth TikTok → Salvar tokens
2. **Criar Post** → Upload de vídeo → Preview
3. **Publicar** → Direct Post ou Agendar (manual)

### Edge Functions Criadas

| Função | Arquivo |
|--------|---------|
| tiktok-auth-start | supabase/functions/tiktok-auth-start/index.ts |
| tiktok-auth-callback | supabase/functions/tiktok-auth-callback/index.ts |
| tiktok-refresh-token | supabase/functions/tiktok-refresh-token/index.ts |
| tiktok-upload-video | supabase/functions/tiktok-upload-video/index.ts |
| tiktok-publish | supabase/functions/tiktok-publish/index.ts |
| tiktok-check-status | supabase/functions/tiktok-check-status/index.ts |

### Integração no Fluxo de Publicação

- `publish-video` agora inclui suporte para TikTok
- `refresh-token` agora renova tokens TikTok automaticamente

---

## CHECKLIST FINAL

### Pré-requisitos
- [ ] Criar app em [TikTok Developers](https://developers.tiktok.com/)
- [ ] Obter CLIENT_KEY e CLIENT_SECRET
- [ ] Configurar Redirect URI no portal TikTok
- [ ] Adicionar scopes: `user.info.basic`, `video.upload`, `video.publish`

### Configuração
- [ ] Adicionar variáveis de ambiente:
  - [ ] `TIKTOK_CLIENT_KEY`
  - [ ] `TIKTOK_CLIENT_SECRET`
- [ ] Executar migration: `20260404000000_add_tiktok_support.sql`
- [ ] Configurar functions no config.toml

### Testes
- [ ] Testar OAuth flow completo
- [ ] Testar upload de vídeo
- [ ] Testar refresh token
- [ ] Testar verificação de status

### Limitações Confirmadas
- ⚠️ Sem agendamento nativo
- ⚠️ Sem upload de arquivo direto (só URL)
- ⚠️ Requer aprovação TikTok para produção

---

## STATUS ATUAL: ✅ IMPLEMENTADO

### Alterações realizadas em 04/04/2026:

1. **Frontend** (`platformServices.ts`):
   - ✅ Adicionado `connectTikTokAccount()`

2. **Frontend** (`PublisherAccounts.tsx`):
   - ✅ Adicionado TikTok na lista de plataformas
   - ✅ Adicionado ícone Video do Lucide
   - ✅ Adicionadas credenciais necessárias na UI

3. **Edge Functions**:
   - ✅ `publish-video` - inclui `publishToTikTok()` com suporte a vídeo e foto/carrossel
   - ✅ `refresh-token` - suporte completo para TikTok OAuth refresh

4. **Configuração**:
   - ✅ `config.toml` já configurado para todas as funções TikTok
   - ✅ Migration `20260404000000_add_tiktok_support.sql` executada

### Próximos passos para ativar:
1. Criar app no TikTok Developers
2. Configurar TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET no Supabase
3. Solicitar aprovação do app para produção

