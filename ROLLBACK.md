# Restoration Points — CreatorOS Publication Module

This document defines the safe points for returning the code and database to a stable state.

## 🏁 Final Stable Snapshot — Content Formats
**Snapshot**: `v1.0.0-content-formats`
**Branch**: `stable/content-format-final`
**Date**: 17/03/2026

### What is protected in this snapshot:
- **Central de Publicação**: Complete UI with separation between "Formato do Conteúdo" and "Plataformas".
- **Formats**: Reels, Carousel (technical: `carousel`), and Story (technical: `story`) fully functional.
- **Backend**: `publish-video` Edge Function correctly interpreting and routing each format.
- **Database**: `content_format` column added and synchronized with frontend types.
- **Compatibility**: Legacy Reels behavior preserved.

### How to Rollback to this state:

#### 1. Code Implementation
```bash
git fetch --all
git checkout stable/content-format-final
```

#### 2. Database (Supabase)
If the schema is corrupted but the column should exist:
- Ensure the column `content_format` exists in `public.publications`.
- If you need to REVERT the column entirely:
  ```sql
  ALTER TABLE public.publications DROP COLUMN IF EXISTS content_format;
  ```

---

## 🕒 Previous Checkpoints (Legacy)

### Pre-Content Format Update (17/03/2026 - Initial)
- **Branch**: `feature/content-formats` (initial state)
- **Files**: `backups/pre-content-format/PublisherHub.tsx.bak`

### Pre-Token Fix
- **Branch**: `backup/pre-token-fix`
