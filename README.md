# Eromify Lite

A self-hostable AI creator studio inspired by the workflow category of AI influencer/content-generation products.

## MVP
- Persona management
- Structured prompt generation
- Image generation job API
- Gallery/job history
- Provider abstraction for local ComfyUI
- Supabase-ready data model
- Pluggable image/video providers

## Local development
1. Copy `.env.example` to `.env.local`.
2. `npm install`
3. `npm run dev`

The UI works without a configured AI provider using demo mode. Configure ComfyUI later for real generation.

## Architecture
Next.js App Router + TypeScript + Tailwind. AI providers are isolated behind `src/lib/providers`.
