import { useState, useRef, useEffect } from 'react'

export function useAudioPlayer(blob: Blob | null) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!blob) return

    // Revoke previous object URL to avoid memory leaks
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
    }

    const url = URL.createObjectURL(blob)
    urlRef.current = url

    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      // WebM blobs from MediaRecorder often report Infinity duration.
      // Seeking to a huge timestamp forces the browser to scan to the real end.
      if (!isFinite(audio.duration)) {
        audio.currentTime = 1e101
        const fix = () => {
          audio.ontimeupdate = null
          setDuration(audio.duration)
          audio.currentTime = 0
        }
        audio.ontimeupdate = fix
      } else {
        setDuration(audio.duration)
      }
    }

    audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
    audio.onended = () => { setIsPlaying(false); setCurrentTime(0) }

    audio.src = url
    audio.load()

    return () => {
      audio.pause()
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
