import { useState, useRef, useCallback } from 'react'
import type { RecorderState } from '../types'

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [levels, setLevels] = useState<number[]>(new Array(24).fill(0))

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const startTimeRef = useRef(0)
  const animFrameRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Wire up analyser for waveform visualisation
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    source.connect(analyser)
    analyserRef.current = analyser

    function tick() {
      if (!analyserRef.current) return
      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(data)
      setLevels(Array.from(data.slice(0, 24)).map((v) => v / 255))
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()

    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' }))
      setDurationSeconds(Math.round((Date.now() - startTimeRef.current) / 1000))
      stream.getTracks().forEach((t) => t.stop())
      cancelAnimationFrame(animFrameRef.current!)
      setLevels(new Array(24).fill(0))
      ctx.close()
    }

    startTimeRef.current = Date.now()
    recorder.start()
    setState('recording')
  }, [])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
    setState('stopped')
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDurationSeconds(0)
    setState('idle')
  }, [])

  return { state, audioBlob, durationSeconds, levels, start, stop, reset }
}
