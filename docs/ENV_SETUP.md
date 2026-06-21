# Environment Setup

Do not commit a real `.env` or `.env.local` file. Use `.env.example` as the safe template, then create your own local `.env.local` with real secrets.

## Required for app shell

- `NEXT_PUBLIC_APP_NAME`: Public app name shown by the UI. Default: `FVN AI Clipper`.
- `NEXT_PUBLIC_APP_URL`: Public local or deployed app URL. Local example: `http://localhost:3000`.

## Database

- `DATABASE_URL`: Required when a backend/database is connected.
- `DIRECT_URL`: Optional direct database connection URL, usually used by migration tooling.

## AI provider

AI features use one OpenAI-compatible adapter. Configure the active provider with these server-side values:

- `AI_PROVIDER`: `openai`, `deepseek`, or `qwen`. Default behavior uses `openai`.
- `AI_API_KEY`: Generic API key fallback for the active provider.
- `AI_BASE_URL`: Optional override for the active provider base URL.
- `AI_MODEL`: Optional override for the active provider model.
- `AI_FALLBACK_PROVIDER`: Optional fallback provider name.
- `AI_FALLBACK_API_KEY`: Optional fallback key. If empty, provider-specific key or `AI_API_KEY` can still be used.
- `AI_FALLBACK_BASE_URL`: Optional fallback base URL override.
- `AI_FALLBACK_MODEL`: Optional fallback model override.

Provider-specific variables are also supported:

- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`
- `QWEN_API_KEY`, `QWEN_BASE_URL`, `QWEN_MODEL` are optional and temporarily ignored. Keep them empty for now.

Resolution rules:

- `AI_PROVIDER=openai` uses `OPENAI_API_KEY` or `AI_API_KEY`.
- `AI_PROVIDER=deepseek` uses `DEEPSEEK_API_KEY` or `AI_API_KEY`.
- `AI_PROVIDER=qwen` uses generic `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` while Qwen-specific env is inactive.
- `AI_BASE_URL` overrides provider base URL for the primary provider.
- `AI_MODEL` overrides provider model for the primary provider.
- If the primary provider request fails, the server retries the fallback provider when `AI_FALLBACK_PROVIDER`, `AI_FALLBACK_API_KEY`, `AI_FALLBACK_BASE_URL`, and `AI_FALLBACK_MODEL` are configured.
- If no configured provider succeeds, API routes return a JSON error with a user-friendly message instead of crashing the UI.

These are server-side secrets. Do not expose them in client-side code. Settings displays only provider status and masked keys.

## YouTube / Google

- `GOOGLE_CLIENT_ID`: Required for YouTube OAuth.
- `GOOGLE_CLIENT_SECRET`: Required for YouTube OAuth.
- `GOOGLE_REDIRECT_URI`: OAuth callback URL. Local example: `http://localhost:3000/api/auth/youtube/callback`.
- `YOUTUBE_API_KEY`: Optional or required depending on whether API-key based YouTube reads are enabled.

## TikTok OAuth

- `TIKTOK_CLIENT_KEY`: Required for TikTok OAuth.
- `TIKTOK_CLIENT_SECRET`: Required for TikTok OAuth.
- `TIKTOK_REDIRECT_URI`: OAuth callback URL. Local example: `http://localhost:3000/api/auth/tiktok/callback`.

## Meta / Instagram / Facebook

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

The frontend reads public feature flags and asks the local API for safe AI provider status. Secret provider keys are masked by the backend before they reach the browser.

## Local redirect URI examples

- YouTube: `http://localhost:3000/api/auth/youtube/callback`
- TikTok: `http://localhost:3000/api/auth/tiktok/callback`
- Meta: `http://localhost:3000/api/auth/meta/callback`

For this Vite UI prototype, the dev server may run on another port, such as `http://localhost:5173`. OAuth callback examples remain backend route targets for the future API service.
