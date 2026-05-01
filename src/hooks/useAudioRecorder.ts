import { useState, useRef, useCallback } from 'react'
import type { RecorderState } from '../types'

type SR = new () => SpeechRecognition

function getSpeechRecognition(): SR | undefined {
  if ('SpeechRecognition' in window) return window.SpeechRecognition as SR
  const w = window as unknown as { webkitSpeechRecognition?: SR }
  return w.webkitSpeechRecognition
}

function getBestMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [levels, setLevels] = useState<number[]>(new Array(24).fill(0))
  const [transcript, setTranscript] = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const startTimeRef = useRef(0)
  const animFrameRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalRef = useRef('')
  const mimeTypeRef = useRef('')

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Waveform analyser
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

    // Detect the best supported audio MIME type for this browser
    const mimeType = getBestMimeType()
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const type = mimeTypeRef.current || 'audio/webm'
      setAudioBlob(new Blob(chunksRef.current, { type }))
      setDurationSeconds(Math.round((Date.now() - startTimeRef.current) / 1000))
      stream.getTracks().forEach((t) => t.stop())
      cancelAnimationFrame(animFrameRef.current!)
      setLevels(new Array(24).fill(0))
      ctx.close()
    }

    // Web Speech API — runs in parallel, builds transcript in real time
    finalRef.current = ''
    setTranscript('')
    const SpeechRecognitionAPI = getSpeechRecognition()

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalRef.current += event.results[i][0].transcript + ' '
          } else {
            interim += event.results[i][0].transcript
          }
        }
        setTranscript(finalRef.current + interim)
      }

      recognition.onend = () => {
        setTranscript(finalRef.current.trim())
      }

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') console.warn('Speech recognition:', event.error)
      }

      recognition.start()
      recognitionRef.current = recognition
    }

    startTimeRef.current = Date.now()
    recorder.start()
    setState('recording')
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recorderRef.current?.stop()
    setState('stopped')
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDurationSeconds(0)
    setTranscript('')
    finalRef.current = ''
    recognitionRef.current = null
    setState('idle')
  }, [])

  return { state, audioBlob, durationSeconds, levels, transcript, start, stop, reset }
}
