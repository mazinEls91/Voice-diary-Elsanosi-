import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '@/store/auth'
import { signOut } from '@/services/auth'

export default function ProfileScreen() {
  const { session, profile } = useAuthStore()

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      <Text style={styles.username}>{profile?.username ?? session?.user.email}</Text>

      <TouchableOpacity style={styles.btn} onPress={signOut}>
        <Text style={styles.btnText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  username: { fontSize: 16, color: '#6b7280', marginBottom: 40 },
  btn: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { color: '#ef4444', fontWeight: '600' },
})
