import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRules = [
  { label: '12 caractères minimum', valid: (value) => value.length >= 12 },
  { label: 'Une lettre', valid: (value) => /[A-Za-z]/.test(value) },
  { label: 'Un chiffre', valid: (value) => /\d/.test(value) },
  { label: 'Un caractère spécial', valid: (value) => /[^A-Za-z\d\s]/.test(value) },
];

// Formulaire de création de compte, aligné visuellement sur l'inscription web responsive.
export default function RegisterScreen({ navigation }) {
  // États du formulaire, du retour API et de la soumission en cours.
  const [form, setForm] = useState({ firstname: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Valide les champs, crée le compte puis ouvre automatiquement la session reçue.
  const handleSubmit = async () => {
    if (!form.firstname.trim() || !form.email.trim() || !form.password) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (!emailPattern.test(form.email.trim())) {
      setError("L'adresse email n'est pas valide. Exemple : nom@domaine.fr");
      return;
    }
    if (!passwordRules.every((rule) => rule.valid(form.password))) {
      setError('Le mot de passe ne respecte pas encore toutes les règles indiquées.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await register({ ...form, firstname: form.firstname.trim(), email: form.email.trim() });
      // Prépare le message de bienvenue première connexion consommé une seule fois par la page Objectifs.
      await AsyncStorage.setItem('pendingWelcome', JSON.stringify({ firstname: data.user.firstname, variant: Math.floor(Math.random() * 6), isRegister: true }));
      await login(data.token);
    } catch (err) {
      setError(err.response?.data?.message || (err.code === 'ECONNABORTED'
        ? 'Le serveur ne répond pas. Vérifie que le backend est lancé et accessible sur le même réseau.'
        : "Impossible de joindre le serveur. Vérifie l'adresse de l'API et ta connexion Wi-Fi."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}><Ionicons name="grid" size={32} color="#FFFFFF" /></View>
          <Text style={styles.title}>Vision Board</Text>
          <Text style={styles.subtitle}>Crée ton compte et commence ton voyage.</Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} placeholder="Ton prénom" placeholderTextColor="#737781" value={form.firstname} onChangeText={(firstname) => setForm({ ...form, firstname })} autoCapitalize="words" editable={!loading} />
          <Text style={styles.label}>Email</Text>
          <TextInput style={[styles.input, form.email.length > 0 && !emailPattern.test(form.email.trim()) && styles.inputInvalid]} placeholder="name@example.com" placeholderTextColor="#737781" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={form.email} onChangeText={(email) => setForm({ ...form, email })} editable={!loading} />
          {form.email.length > 0 && !emailPattern.test(form.email.trim()) ? <Text style={styles.fieldError}>Saisis une adresse valide, par exemple nom@domaine.fr.</Text> : null}
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput style={[styles.input, styles.passwordInput]} placeholder="••••••••" placeholderTextColor="#737781" secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} editable={!loading} />
          <View style={styles.rules}>
            {passwordRules.map((rule) => {
              const valid = rule.valid(form.password);
              return <Text key={rule.label} style={[styles.rule, valid && styles.ruleValid]}>{valid ? '✓' : '○'} {rule.label}</Text>;
            })}
          </View>
          <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <View style={styles.buttonContent}><Text style={styles.buttonText}>Inscription</Text><Ionicons name="arrow-forward" size={20} color="#FFFFFF" /></View>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}><Text style={styles.footerText}>Déjà un compte ? </Text><TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={styles.footerLink}>Connexion</Text></TouchableOpacity></View>
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
  inputInvalid: { borderColor: '#BA1A1A', marginBottom: 6 },
  fieldError: { color: '#BA1A1A', fontSize: 12, marginLeft: 4, marginBottom: 14 },
  passwordInput: { marginBottom: 8 },
  rules: { marginLeft: 4, marginBottom: 18, gap: 4 },
  rule: { color: '#737781', fontSize: 12 },
  ruleValid: { color: '#007151', fontWeight: '600' },
  button: { height: 56, backgroundColor: '#2E5797', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#2E5797', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.65 },
  error: { color: '#93000A', backgroundColor: '#FFDAD6', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#737781', fontSize: 14 },
  footerLink: { color: '#2E5797', fontSize: 14, fontWeight: '700' },
});
