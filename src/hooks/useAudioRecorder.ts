import { useState, useRef, useCallback } from 'react'
import type { RecorderState } from '../types'

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [durationSeconds, setDurationSeconds] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const startTimeRef = useRef<number>(0)

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setAudioBlob(blob)
      setDurationSeconds(Math.round((Date.now() - startTimeRef.current) / 1000))
      stream.getTracks().forEach((t) => t.stop())
    }

    startTimeRef.current = Date.now()
    recorder.start()
    setState('recording')
  }, [])

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setState('stopped')
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDurationSeconds(0)
    setState('idle')
  }, [])

  return { state, audioBlob, durationSeconds, start, stop, reset }
}
