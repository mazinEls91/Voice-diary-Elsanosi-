import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Link } from 'expo-router'
import { signUp } from '@/services/auth'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!email || !password || !username) return
    setLoading(true)
    try {
      await signUp(email, password, username)
      Alert.alert('Check your email', 'Click the confirmation link to activate your account.')
    } catch (err: unknown) {
      Alert.alert('Sign up failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput
        style={styles.input} placeholder="Email"
        autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/sign-in" style={styles.link}>Already have an account? Sign in</Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16,
  },
  btn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 20, textAlign: 'center', color: '#3b82f6' },
})
