 import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { login as loginApi } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async () => {
    setError('');
    try {
      const { data } = await loginApi(form);
      await login(data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vision Board</Text>
      <Text style={styles.subtitle}>Visualise ton avancée, atteins tes rêves.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(t) => setForm({ ...form, email: t })}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={form.password}
        onChangeText={(t) => setForm({ ...form, password: t })}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Connexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#6750A4' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 14, marginBottom: 12 },
  button: { backgroundColor: '#6750A4', borderRadius: 30, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: 'red', textAlign: 'center', marginBottom: 12 },
});
