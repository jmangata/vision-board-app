// Profil mobile : consultation, édition sécurisée, liens d'aide et suppression RGPD du compte.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import TopBar from '../components/TopBar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://visionboard-frontend.onrender.com';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{12,}$/;
const emptyForm = { firstname: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const { logout } = useAuth();

  // Recharge le profil à chaque focus afin de synchroniser les informations et les compteurs.
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
      setForm((current) => ({ ...current, firstname: data.firstname || '', email: data.email || '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const cancelEditing = () => {
    setEditing(false);
    setError('');
    setForm({ ...emptyForm, firstname: user.firstname || '', email: user.email || '' });
  };

  // Valide localement les champs avant d'envoyer uniquement les données acceptées par l'API.
  // Les mots de passe restent dans l'état du formulaire et ne sont jamais affichés ni journalisés.
  const saveProfile = async () => {
    const firstname = form.firstname.trim();
    const email = form.email.trim();
    setError('');
    setSuccess('');
    if (!firstname) return setError('Le prénom est obligatoire.');
    if (!emailPattern.test(email)) return setError("L'adresse email n'est pas valide. Exemple : nom@domaine.fr");
    if (form.newPassword) {
      if (!form.currentPassword) return setError('Le mot de passe actuel est obligatoire pour définir un nouveau mot de passe.');
      if (!passwordPattern.test(form.newPassword)) return setError('Le nouveau mot de passe doit contenir au moins 12 caractères, une lettre, un chiffre et un caractère spécial.');
      if (form.newPassword !== form.confirmPassword) return setError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
    } else if (form.confirmPassword) {
      return setError('Renseigne le nouveau mot de passe avant sa confirmation.');
    }
    setSaving(true);
    try {
      const payload = { firstname, email };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const { data } = await api.put('/users/me', payload);
      setUser((current) => ({ ...current, ...data }));
      setForm({ ...emptyForm, firstname: data.firstname, email: data.email });
      setEditing(false);
      setSuccess('Profil mis à jour avec succès.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  // Exige le mot de passe puis délègue la confirmation irréversible à l'alerte native.
  const confirmDelete = () => {
    if (!deletePassword) return setError('Entre ton mot de passe pour confirmer la suppression.');
    Alert.alert('Supprimer le compte', 'Cette action est définitive : tous tes objectifs, étapes, rappels et badges seront effacés.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/users/me', { data: { password: deletePassword } });
          setDeletePassword('');
          await logout();
        } catch (err) {
          setError(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
      } },
    ]);
  };

  const memberSince = user ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Mon profil" />
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#2E5797" /></View> : (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {success ? <Text style={styles.success}>{success}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!user ? <TouchableOpacity style={styles.primaryButton} onPress={loadProfile}><Text style={styles.primaryButtonText}>Réessayer</Text></TouchableOpacity> : (
            <>
              <View style={styles.card}>
                <View style={styles.avatar}><Text style={styles.avatarLetter}>{user.firstname.charAt(0).toUpperCase()}</Text></View>
                <Text style={styles.name}>{user.firstname}</Text><Text style={styles.email}>{user.email}</Text>
                <Text style={styles.since}>Membre depuis le {memberSince}</Text>
                <View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{user._count?.goals ?? 0}</Text><Text style={styles.statLabel}>Objectifs</Text></View><View style={styles.stat}><Text style={styles.statValue}>{user._count?.badges ?? 0}</Text><Text style={styles.statLabel}>Badges</Text></View></View>
              </View>

              {editing ? (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Modifier le profil</Text>
                  <Text style={styles.label}>Prénom</Text><TextInput style={styles.input} value={form.firstname} onChangeText={(value) => updateForm('firstname', value)} autoCapitalize="words" editable={!saving} />
                  <Text style={styles.label}>Email</Text><TextInput style={styles.input} value={form.email} onChangeText={(value) => updateForm('email', value)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!saving} />
                  <View style={styles.separator} /><Text style={styles.passwordTitle}>Changer le mot de passe (optionnel)</Text><Text style={styles.hint}>Remplis ces champs uniquement si tu souhaites modifier ton mot de passe actuel.</Text>
                  <Text style={styles.label}>Mot de passe actuel</Text><TextInput style={styles.input} value={form.currentPassword} onChangeText={(value) => updateForm('currentPassword', value)} secureTextEntry editable={!saving} />
                  <Text style={styles.label}>Nouveau mot de passe</Text><TextInput style={styles.input} value={form.newPassword} onChangeText={(value) => updateForm('newPassword', value)} secureTextEntry editable={!saving} />
                  <Text style={styles.rules}>12 caractères minimum, une lettre, un chiffre et un caractère spécial.</Text>
                  <Text style={styles.label}>Confirmer le nouveau mot de passe</Text><TextInput style={styles.input} value={form.confirmPassword} onChangeText={(value) => updateForm('confirmPassword', value)} secureTextEntry editable={!saving} />
                  <View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={cancelEditing} disabled={saving}><Text style={styles.secondaryButtonText}>Annuler</Text></TouchableOpacity><TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Enregistrer</Text>}</TouchableOpacity></View>
                </View>
              ) : (
                <>
                  <MenuRow icon="edit" label="Modifier le profil" onPress={() => { setError(''); setSuccess(''); setEditing(true); }} />
                  <MenuRow icon="key" label="Mot de passe oublié" onPress={() => Linking.openURL(`${WEB_URL}/forgot-password`)} />
                  <MenuRow icon="privacy-tip" label="Politique de confidentialité" onPress={() => Linking.openURL(`${WEB_URL}/privacy`)} muted />
                  <MenuRow icon="logout" label="Déconnexion" onPress={logout} danger />
                </>
              )}

              {!editing && <View style={styles.dangerCard}><Text style={styles.dangerTitle}>Zone de danger</Text><Text style={styles.dangerText}>La suppression du compte efface définitivement toutes tes données (droit à l'oubli).</Text>{!deleting ? <TouchableOpacity style={styles.dangerButton} onPress={() => setDeleting(true)}><MaterialIcons name="delete-forever" size={22} color="#93000A" /><Text style={styles.dangerButtonText}>Supprimer mon compte</Text></TouchableOpacity> : <><TextInput style={styles.input} placeholder="Mot de passe de confirmation" placeholderTextColor="#737781" secureTextEntry value={deletePassword} onChangeText={setDeletePassword} /><View style={styles.actions}><TouchableOpacity style={styles.secondaryButton} onPress={() => { setDeleting(false); setDeletePassword(''); }}><Text style={styles.secondaryButtonText}>Annuler</Text></TouchableOpacity><TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}><Text style={styles.primaryButtonText}>Confirmer</Text></TouchableOpacity></View></>}</View>}
            </>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

// Ligne d'action réutilisée pour conserver les mêmes dimensions, icônes et états de couleur.
function MenuRow({ icon, label, onPress, danger, muted }) {
  const color = danger ? '#93000A' : muted ? '#737781' : '#2E5797';
  return <TouchableOpacity style={styles.row} onPress={onPress}><MaterialIcons name={icon} size={22} color={color} /><Text style={[styles.rowText, danger && styles.dangerRowText]}>{label}</Text><MaterialIcons name="chevron-right" size={22} color="#737781" style={styles.chevron} /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F9FF' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 112 },
  error: { color: '#93000A', backgroundColor: '#FFDAD6', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center', fontFamily: 'Inter_500Medium' }, success: { color: '#005138', backgroundColor: '#B9F4DA', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center', fontFamily: 'Inter_500Medium' },
  card: { alignItems: 'center', padding: 24, borderWidth: 1, borderColor: '#E2E2E8', borderRadius: 16, backgroundColor: '#FFFFFF', marginBottom: 16 }, avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2E5797', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, avatarLetter: { color: '#FFFFFF', fontSize: 30, fontFamily: 'Inter_700Bold' }, name: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#1A1C20' }, email: { fontSize: 14, color: '#737781', marginTop: 2, fontFamily: 'Inter_400Regular' }, since: { fontSize: 12, color: '#737781', marginTop: 6 }, stats: { flexDirection: 'row', gap: 40, marginTop: 16 }, stat: { alignItems: 'center' }, statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#2E5797' }, statLabel: { fontSize: 12, color: '#737781' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: 1, borderColor: '#E2E2E8', borderRadius: 16, backgroundColor: '#FFFFFF', marginBottom: 10 }, rowText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#1A1C20' }, dangerRowText: { color: '#93000A' }, chevron: { marginLeft: 'auto' },
  formCard: { padding: 20, borderWidth: 1, borderColor: '#E2E2E8', borderRadius: 16, backgroundColor: '#FFFFFF', marginBottom: 16 }, formTitle: { color: '#1A1C20', fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 20 }, label: { color: '#434750', fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 7 }, input: { minHeight: 52, borderWidth: 1, borderColor: '#C3C6D2', borderRadius: 14, paddingHorizontal: 16, marginBottom: 16, color: '#1A1C20', backgroundColor: '#F9F9FF', fontSize: 16 }, separator: { height: 1, backgroundColor: '#E2E2E8', marginVertical: 6 }, passwordTitle: { color: '#1A1C20', fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 14 }, hint: { color: '#737781', fontSize: 12, lineHeight: 17, marginTop: 5, marginBottom: 16 }, rules: { color: '#737781', fontSize: 11, lineHeight: 16, marginTop: -10, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 }, primaryButton: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: '#2E5797', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, primaryButtonText: { color: '#FFFFFF', fontFamily: 'Inter_700Bold' }, secondaryButton: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: '#C3C6D2', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, secondaryButtonText: { color: '#1A1C20', fontFamily: 'Inter_600SemiBold' }, disabled: { opacity: 0.65 },
  dangerCard: { marginTop: 14, padding: 16, borderWidth: 1, borderColor: '#FFDAD6', borderRadius: 16, backgroundColor: '#FFF8F7' }, dangerTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#93000A', marginBottom: 6 }, dangerText: { fontSize: 13, color: '#737781', lineHeight: 18, marginBottom: 12 }, dangerButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }, dangerButtonText: { color: '#93000A', fontSize: 15, fontFamily: 'Inter_600SemiBold' }, deleteButton: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: '#93000A', alignItems: 'center', justifyContent: 'center' },
});
