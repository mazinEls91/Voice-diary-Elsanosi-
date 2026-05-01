import { useState, useRef, useEffect } from 'react'

export function useAudioPlayer(blob: Blob | null) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!blob) return

    if (urlRef.current) URL.revokeObjectURL(urlRef.current)

    const url = URL.createObjectURL(blob)
    urlRef.current = url

    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    // Keep progress bar in sync throughout playback
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    audio.addEventListener('timeupdate', onTimeUpdate)

    audio.addEventListener('loadedmetadata', () => {
      if (!isFinite(audio.duration)) {
        // WebM blobs from MediaRecorder often report Infinity duration.
        // Seeking to a huge value forces the browser to scan to the real end.
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

    audio.src = url
    audio.load()

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.src = ''
      URL.revokeObjectURL(url)
      urlRef.current = null
    }
  }, [blob])

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
