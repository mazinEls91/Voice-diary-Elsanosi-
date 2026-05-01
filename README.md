# Voice Diary — Elsanosi

A personal audio diary app for capturing thoughts, epiphanies, and reflections.

---

## Current Phase: Web Prototype

Building and designing the core UI/UX locally in the browser before wiring up cloud services.

| Feature | Status |
|---------|--------|
| Audio recording + live waveform | Ready |
| IndexedDB local persistence | Ready |
| Entry timeline + playback | Ready |
| AI Brainstorm (Claude streaming) | Ready |
| Transcription (Whisper) | Coming next |
| Cloud sync (Supabase) | Later |
| Auth / sharing | Later |
| React Native mobile app | Later |

## Getting Started

```bash
npm install
npm run dev
```

To use the AI Brainstorm feature, open **Settings** (gear icon) and paste your Anthropic API key. It stays in your browser's local storage only.

## Planned Full Stack

| Layer | Technology |
|-------|------------|
| Mobile app | React Native + Expo |
| Auth | Supabase Auth |
| Cloud storage | Supabase Storage + PostgreSQL |
| Transcription | OpenAI Whisper |
| AI conversation | Anthropic Claude |

See `supabase/schema.sql` for the full database schema designed for the production version.
