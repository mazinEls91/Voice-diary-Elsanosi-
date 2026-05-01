import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Link } from 'expo-router'
import { signIn } from '@/services/auth'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    if (!email || !password) return
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      Alert.alert('Sign in failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Diary</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={handleSignIn} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/sign-up" style={styles.link}>
        Don't have an account? Sign up
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#6b7280', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16,
  },
  btn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 20, textAlign: 'center', color: '#3b82f6' },
})
