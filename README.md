# Voice Diary — Elsanosi

> Never lose an important thought again.

A personal audio memory system — part voice diary, part AI thought companion, part searchable second brain.

---

## Current Phase: Web Prototype

Designing and validating the core UI/UX in the browser before wiring up cloud services.

| Feature | Status |
|---------|--------|
| Audio recording + live waveform | Ready |
| IndexedDB local persistence | Ready |
| Entry timeline + custom player | Ready |
| Search (title, transcript, summary) | Ready |
| AI auto-tag + smart title + summary | Ready |
| Perspective Mode (5 personalities + intensity) | Ready |
| Transcription (Whisper) | Coming next |
| Cloud sync (Supabase) | Later |
| Biometric lock + E2E encryption | Later |
| React Native mobile app | Later |

---

## Perspective Mode

The core AI differentiator. Choose a personality and intensity before each session:

| Personality | Purpose |
|-------------|----------|
| Listener | Reflects back, validates, never advises |
| Comfort | Warm encouragement, emotional support |
| Reality Check | Honest, balanced, calls things out gently |
| Strategist | Extracts action from chaos |
| Challenger | Devil’s advocate, stress-tests thinking |

Intensity: **Soft → Direct → Tough**

All modes include safety rails — Claude will redirect to professional help if a mental health crisis is detected.

---

## Getting Started

```bash
npm install
npm run dev
```

Open **Settings** (gear icon) and add your Anthropic API key to enable Perspective Mode and AI auto-tagging.

---

## Roadmap

1. **Transcription** — Whisper API after recording stops
2. **Search** — full semantic/emotion-based search (Supabase vectors)
3. **Mobile** — React Native + Expo
4. **Auth + sync** — Supabase Auth + Storage
5. **Sharing** — share entries with other users
6. **Privacy** — biometric lock, on-device transcription option, E2E encryption
