import * as FileSystem from 'expo-file-system'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

/**
 * Transcribes a local audio file using OpenAI Whisper.
 * Called after recording stops, before saving to DB.
 */
export async function transcribeAudio(localUri: string): Promise<string> {
  const formData = new FormData()

  // React Native FormData accepts { uri, name, type } objects
  formData.append('file', {
    uri: localUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob)
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'text')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Whisper transcription failed: ${err}`)
  }

  return response.text()
}
