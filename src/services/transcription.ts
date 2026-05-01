/**
 * Transcribes an audio Blob using OpenAI Whisper.
 * Called after recording stops, before the entry is saved.
 */
export async function transcribeAudio(apiKey: string, blob: Blob): Promise<string> {
  const form = new FormData()
  // Whisper accepts webm, mp4, m4a, wav, ogg — browser MediaRecorder outputs webm
  form.append('file', blob, 'recording.webm')
  form.append('model', 'whisper-1')
  form.append('response_format', 'text')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`Whisper error ${res.status}: ${msg}`)
  }

  return (await res.text()).trim()
}
