import { useState, useRef, useCallback } from 'react'
import { Audio } from 'expo-av'

export function useAudioPlayer(audioUri: string) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [positionSeconds, setPositionSeconds] = useState(0)
  const soundRef = useRef<Audio.Sound | null>(null)

  const load = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync()
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: false },
      (status) => {
        if (status.isLoaded) {
          setPositionSeconds(Math.round((status.positionMillis ?? 0) / 1000))
          if (status.didJustFinish) setIsPlaying(false)
        }
      }
    )
    soundRef.current = sound
  }, [audioUri])

  const play = useCallback(async () => {
    if (!soundRef.current) await load()
    await soundRef.current?.playAsync()
    setIsPlaying(true)
  }, [load])

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync()
    setIsPlaying(false)
  }, [])

  const unload = useCallback(async () => {
    await soundRef.current?.unloadAsync()
    soundRef.current = null
  }, [])

  return { isPlaying, positionSeconds, load, play, pause, unload }
}
