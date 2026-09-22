// Écran de connexion : affiche le formulaire d'identification,
// appelle le backend puis met à jour le contexte d'authentification.
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:5173';

export default function LoginScreen({ navigation }) {
  // État local du formulaire et des éventuels messages d'erreur.
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  // Désactive les champs et affiche l'indicateur pendant l'appel réseau.
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Soumission : on réinitialise l'erreur, on appelle l'API puis on stocke le token.
  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password) {
      setError('Renseigne ton email et ton mot de passe.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await loginApi({ email: form.email.trim(), password: form.password });
      // Prépare le message de retour consommé une seule fois par la page Objectifs.
      await AsyncStorage.setItem('pendingWelcome', JSON.stringify({ firstname: data.user.firstname, variant: Math.floor(Math.random() * 6), isRegister: false }));
      await login(data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Interface simple : titre, champs email/mot de passe, message d'erreur et bouton de connexion.
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}><Ionicons name="grid" size={32} color="#FFFFFF" /></View>
          <Text style={styles.title}>Vision Board</Text>
          <Text style={styles.subtitle}>Visualise ton avancée, atteins tes rêves.</Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="name@example.com" placeholderTextColor="#737781" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={form.email} onChangeText={(email) => setForm({ ...form, email })} editable={!loading} />
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#737781" secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} editable={!loading} onSubmitEditing={handleSubmit} />
          <TouchableOpacity onPress={() => Linking.openURL(`${WEB_URL}/forgot-password`)}>
            <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <View style={styles.buttonContent}><Text style={styles.buttonText}>Connexion</Text><Ionicons name="arrow-forward" size={20} color="#FFFFFF" /></View>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}><Text style={styles.footerText}>Pas de compte ? </Text><TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={styles.footerLink}>Inscription</Text></TouchableOpacity></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F9FF' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 22, backgroundColor: '#2E5797', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', color: '#0D3F7E', letterSpacing: -0.5 },
  subtitle: { textAlign: 'center', color: '#737781', marginTop: 8 },
  card: { padding: 24, borderWidth: 1, borderColor: '#E2E2E8', borderRadius: 16, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  label: { marginLeft: 4, marginBottom: 7, color: '#434750', fontSize: 14, fontWeight: '600' },
  input: { height: 54, borderWidth: 1, borderColor: '#C3C6D2', borderRadius: 14, paddingHorizontal: 16, marginBottom: 18, color: '#1A1C20', backgroundColor: '#F9F9FF', fontSize: 16 },
  button: { height: 56, backgroundColor: '#2E5797', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#2E5797', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.65 },
  error: { color: '#93000A', backgroundColor: '#FFDAD6', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#737781', fontSize: 14 },
  footerLink: { color: '#2E5797', fontSize: 14, fontWeight: '700' },
  forgotLink: { color: '#2E5797', fontSize: 13, textAlign: 'right', marginTop: -10, marginBottom: 12, marginRight: 4 },
});
