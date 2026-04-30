# Voice Diary — Elsanosi

A personal audio diary app. Record your thoughts, epiphanies, and reflections on the go, then review them later.

## Concept

- **Record**: Tap to record a voice note at any moment
- **Tag & Title**: Add a short title or mood tag after recording
- **Review**: Browse past entries in a timeline or by tag
- **Playback**: Listen back with waveform visualisation

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Audio | Web Audio API + MediaRecorder API |
| Storage | IndexedDB (local-first, no sign-in required) |
| Styling | CSS Modules |

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
  components/      # UI components
  hooks/           # Custom React hooks (audio, storage)
  types/           # Shared TypeScript types
  utils/           # Pure helper functions
  App.tsx
  main.tsx
```
