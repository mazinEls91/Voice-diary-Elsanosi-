import { useState, useRef, useCallback } from 'react'
import { Audio } from 'expo-av'
import type { RecorderState } from '../types'

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [uri, setUri] = useState<string | null>(null)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const recordingRef = useRef<Audio.Recording | null>(null)

  const start = useCallback(async () => {
    await Audio.requestPermissionsAsync()
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    })

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    )
    recordingRef.current = recording
    setState('recording')
  }, [])

  const stop = useCallback(async () => {
    const recording = recordingRef.current
    if (!recording) return

    await recording.stopAndUnloadAsync()
    const status = await recording.getStatusAsync()
    const fileUri = recording.getURI()

    setUri(fileUri ?? null)
    setDurationSeconds(Math.round((status.durationMillis ?? 0) / 1000))
    setState('stopped')
  }, [])

  const reset = useCallback(() => {
    recordingRef.current = null
    setUri(null)
    setDurationSeconds(0)
    setState('idle')
  }, [])

  return { state, uri, durationSeconds, start, stop, reset }
}
