import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/store/auth'

export default function RootLayout() {
  const { session, setSession } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) router.replace('/(auth)/sign-in')
    if (session && inAuthGroup) router.replace('/(tabs)/')
  }, [session, segments])

  return <Slot />
}
