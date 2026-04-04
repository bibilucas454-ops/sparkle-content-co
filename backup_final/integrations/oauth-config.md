# OAuth & Integrations Configuration - Sparkle Content Co

## Platform OAuth Configs

### YouTube
- **Auth URL**: https://accounts.google.com/o/oauth2/v2/auth
- **Scopes**: 
  - https://www.googleapis.com/auth/youtube.upload
  - https://www.googleapis.com/auth/youtube.readonly
  - https://www.googleapis.com/auth/userinfo.profile
- **Env Variables**: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET

### Instagram (Meta)
- **Auth URL**: https://www.facebook.com/v19.0/dialog/oauth
- **Scopes**:
  - instagram_basic
  - instagram_content_publish
  - pages_show_list
  - pages_read_engagement
  - business_management
- **Env Variables**: INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET
- **Graph API Version**: v19.0

### TikTok
- **Auth URL**: https://www.tiktok.com/v2/auth/authorize/
- **Scopes**: user.info.basic, video.publish, video.upload
- **Env Variables**: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET

## OAuth Flow

1. **oauth-connect** - Initiates OAuth flow, creates state in DB
2. **oauth-callback** - Handles callback, exchanges code for tokens, stores encrypted tokens
3. **refresh-token** - Refreshes expired tokens

## Token Storage
- Tokens are encrypted using AES-GCM (see `_shared/crypto.ts`)
- Stored in `social_tokens` table with columns:
  - access_token_encrypted
  - refresh_token_encrypted
  - expires_at

## Supabase Project
- **Project ID**: wjzxntgpuimiubrnqfnz
- **URL**: https://wjzxntgpuimiubrnqfnz.supabase.co
