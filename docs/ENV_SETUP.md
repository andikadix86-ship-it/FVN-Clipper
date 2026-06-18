# Environment Setup

Do not commit a real `.env` or `.env.local` file. Use `.env.example` as the safe template, then create your own local `.env.local` with real secrets.

## Required for app shell

- `NEXT_PUBLIC_APP_NAME`: Public app name shown by the UI. Default: `FVN AI Clipper`.
- `NEXT_PUBLIC_APP_URL`: Public local or deployed app URL. Local example: `http://localhost:3000`.

## Database

- `DATABASE_URL`: Required when a backend/database is connected.
- `DIRECT_URL`: Optional direct database connection URL, usually used by migration tooling.

## AI providers

- `GEMINI_API_KEY`: Required for Gemini features.
- `OPENAI_API_KEY`: Required for OpenAI features.
- `ANTHROPIC_API_KEY`: Required for Claude/Anthropic features.

These are server-side secrets. Do not expose them in client-side code.

## YouTube / Google

- `GOOGLE_CLIENT_ID`: Required for YouTube OAuth.
- `GOOGLE_CLIENT_SECRET`: Required for YouTube OAuth.
- `GOOGLE_REDIRECT_URI`: OAuth callback URL. Local example: `http://localhost:3000/api/auth/youtube/callback`.
- `YOUTUBE_API_KEY`: Optional or required depending on whether API-key based YouTube reads are enabled.

## TikTok OAuth

- `TIKTOK_CLIENT_KEY`: Required for TikTok OAuth.
- `TIKTOK_CLIENT_SECRET`: Required for TikTok OAuth.
- `TIKTOK_REDIRECT_URI`: OAuth callback URL. Local example: `http://localhost:3000/api/auth/tiktok/callback`.

## Meta / Instagram / Facebook OAuth

- `META_APP_ID`: Required for Meta OAuth.
- `META_APP_SECRET`: Required for Meta OAuth.
- `META_REDIRECT_URI`: OAuth callback URL. Local example: `http://localhost:3000/api/auth/meta/callback`.

## Telegram

- `TELEGRAM_BOT_TOKEN`: Required for Telegram approval notifications.
- `TELEGRAM_CHAT_ID`: Required for the target Telegram chat.

## Storage

- `STORAGE_PROVIDER`: Optional. Use `local` for demo/local storage.
- `SUPABASE_URL`: Required only when Supabase storage is enabled.
- `SUPABASE_ANON_KEY`: Required only when Supabase client access is enabled.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side secret for privileged Supabase access. Never expose it to the client.

## Feature flags

- `NEXT_PUBLIC_ENABLE_DEMO_DATA`: Demo-only flag. Use `true` for local demo mode.
- `NEXT_PUBLIC_ENABLE_REAL_API`: Use `false` until backend/API integrations are ready.
- `NEXT_PUBLIC_ENABLE_AUTO_POSTING`: Use `false` until real social posting is approved and connected.

## UI status behavior

The current frontend can safely read public feature flags only. Secret provider keys are intentionally treated as server-side configuration. In demo mode, Settings shows provider and integration cards as `Demo Mode` or `Not Connected` instead of exposing secrets.

## Local redirect URI examples

- YouTube: `http://localhost:3000/api/auth/youtube/callback`
- TikTok: `http://localhost:3000/api/auth/tiktok/callback`
- Meta: `http://localhost:3000/api/auth/meta/callback`

For this Vite UI prototype, the dev server may run on another port, such as `http://localhost:5173`. OAuth callback examples remain backend route targets for the future API service.
