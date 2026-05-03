import { useState, useRef, useEffect } from 'react'

export function useAudioPlayer(blob: Blob | null, audioUrl?: string) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Prefer an in-memory blob; fall back to the remote URL from Supabase
    let src: string | null = null
    let isObjectUrl = false

    if (blob) {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      src = URL.createObjectURL(blob)
      objectUrlRef.current = src
      isObjectUrl = true
    } else if (audioUrl) {
      src = audioUrl
    }

    if (!src) return

    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    audio.addEventListener('timeupdate', onTimeUpdate)

    audio.addEventListener('loadedmetadata', () => {
      if (!isFinite(audio.duration)) {
        // WebM from MediaRecorder often reports Infinity; seek trick fixes it
        const onceFixed = () => {
          audio.removeEventListener('timeupdate', onceFixed)
          setDuration(audio.duration)
          audio.currentTime = 0
        }
        audio.addEventListener('timeupdate', onceFixed)
        audio.currentTime = 1e101
      } else {
        setDuration(audio.duration)
      }
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    audio.src = src
    audio.load()

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.src = ''
      if (isObjectUrl && objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [blob, audioUrl])

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Audio playback failed:', err)
        setIsPlaying(false)
      }
    }
  }

  function seek(time: number) {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return { isPlaying, currentTime, duration, togglePlay, seek }
}
