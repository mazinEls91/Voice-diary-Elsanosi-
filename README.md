# Voice Diary — Elsanosi

A personal audio diary app for capturing thoughts, epiphanies, and reflections. Record, transcribe, and brainstorm with an AI — like having a private podcast with yourself.

---

## Features

| Feature | Description |
|---------|-------------|
| **Record** | One-tap audio recording saved locally on device |
| **Transcribe** | Auto-transcription via OpenAI Whisper |
| **AI Brainstorm** | Back-and-forth podcast-style conversation with Claude AI |
| **Cloud Sync** | Entries synced to Supabase (audio files + metadata) |
| **Offline First** | Works without internet; syncs when connection resumes |
| **Auth** | Email/password sign-in with secure sessions |
| **Sharing** | Share individual entries with other app users |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile framework | React Native + Expo (iOS & Android) |
| Navigation | Expo Router (file-based) |
| Local storage | Expo SQLite (metadata) + Expo FileSystem (audio) |
| Cloud backend | Supabase (Auth + PostgreSQL + Storage + Realtime) |
| Transcription | OpenAI Whisper API |
| AI conversation | Anthropic Claude API (streaming) |
| State management | Zustand |
| Styling | StyleSheet + NativeWind |

---

## Project Structure

```
app/                        # Expo Router screens
  (auth)/
    sign-in.tsx
    sign-up.tsx
  (tabs)/
    index.tsx               # Record + recent entries
    library.tsx             # Full entry timeline
    profile.tsx             # User profile & settings
  entry/
    [id].tsx                # Single entry detail
    [id]/brainstorm.tsx     # AI podcast session for an entry
  _layout.tsx

src/
  components/               # Shared UI components
  hooks/                    # Custom React hooks
  services/
    supabase.ts             # Supabase client
    auth.ts                 # Auth helpers
    storage.ts              # Upload/download audio
    transcription.ts        # Whisper API
    brainstorm.ts           # Claude API conversation
    sync.ts                 # Local <-> cloud sync logic
  store/
    entries.ts              # Zustand entries store
    auth.ts                 # Zustand auth store
  types/
    index.ts
  utils/
    audio.ts
    format.ts

supabase/
  schema.sql               # Full database schema
  seed.sql                 # Dev seed data
```

---

## Getting Started

```bash
npm install
npx expo start
```

Requires `.env` with:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## Database Schema Overview

```
profiles         — extended user info
entries          — audio diary entries
brainstorm_sessions — AI podcast sessions linked to an entry
brainstorm_messages — individual turns in a session
shared_entries   — sharing relationships between users
tags / entry_tags — optional tagging system
```

See `supabase/schema.sql` for the full schema with RLS policies.
