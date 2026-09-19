// Écran de profil : affiche les informations du compte, permet la déconnexion,
// la suppression définitive du compte (droit à l'oubli RGPD) et l'accès aux
// pages légales et de réinitialisation de mot de passe hébergées sur le web.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// URL publique du frontend web (pages forgot-password et privacy).
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://visionboard-frontend.onrender.com';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const { logout } = useAuth();

  // Charge le profil de l'utilisateur connecté au montage de l'écran.
  useEffect(() => {
    api.get('/users/me')
      .then((res) => setUser(res.data))
      .catch(() => setError('Impossible de charger le profil.'));
  }, []);

  // Suppression du compte : confirmation puis envoi du mot de passe au backend.
  const confirmDelete = () => {
    if (!password) {
      setError('Entre ton mot de passe pour confirmer la suppression.');
      return;
    }
    Alert.alert(
      'Supprimer le compte',
      'Cette action est définitive : tous tes objectifs, étapes, rappels et badges seront effacés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me', { data: { password } });
              await logout();
            } catch (err) {
              setError(err.response?.data?.message || 'Erreur lors de la suppression.');
            }
          },
        },
      ]
    );
  };

  const memberSince = user
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mon profil</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!user ? (
        <ActivityIndicator color="#2E5797" style={{ marginTop: 32 }} />
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{user.firstname.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{user.firstname}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.since}>Membre depuis le {memberSince}</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user._count?.goals ?? 0}</Text>
                <Text style={styles.statLabel}>Objectifs</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user._count?.badges ?? 0}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL(`${WEB_URL}/forgot-password`)}>
            <Ionicons name="key-outline" size={22} color="#2E5797" />
            <Text style={styles.rowText}>Changer de mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color="#737781" style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#737781" />
            <Text style={styles.rowText}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={20} color="#737781" style={styles.chevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#93000A" />
            <Text style={[styles.rowText, { color: '#93000A' }]}>Déconnexion</Text>
            <Ionicons name="chevron-forward" size={20} color="#737781" style={styles.chevron} />
          </TouchableOpacity>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Zone de danger</Text>
            <Text style={styles.dangerText}>
              La suppression du compte efface définitivement toutes tes données (droit à l'oubli).
            </Text>
            {!deleting ? (
              <TouchableOpacity style={styles.dangerButton} onPress={() => setDeleting(true)}>
                <Ionicons name="trash-outline" size={20} color="#93000A" />
                <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe de confirmation"
                  placeholderTextColor="#737781"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <View style={styles.dangerActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setDeleting(false); setPassword(''); }}>
                    <Text style={styles.cancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={confirmDelete}>
                    <Text style={styles.confirmText}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F9FF' },
  container: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },
  title: { color: '#0D3F7E', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  error: { color: '#93000A', backgroundColor: '#FFDAD6', borderRadius: 12, padding: 12, marginBottom: 16, textAlign: 'center' },
  card: { alignItems: 'center', padding: 24, borderWidth: 1, borderColor: '#E2E2E8', borderRadius: 16, backgroundColor: '#FFFFFF', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2E5797', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarLetter: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#1A1C20' },
  email: { fontSize: 14, color: '#737781', marginTop: 2 },
  since: { fontSize: 12, color: '#9DA3AF', marginTop: 6 },
  stats: { flexDirection: 'row', gap: 40, marginTop: 16 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#2E5797' },
  statLabel: { fontSize: 12, color: '#737781' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderWidth: 1, borderColor: '#E2E2E8', borderRadius: 16, backgroundColor: '#FFFFFF', marginBottom: 10 },
  rowText: { fontSize: 15, fontWeight: '600', color: '#1A1C20' },
  chevron: { marginLeft: 'auto' },
  dangerCard: { marginTop: 14, padding: 16, borderWidth: 1, borderColor: '#FFDAD6', borderRadius: 16, backgroundColor: '#FFF8F7' },
  dangerTitle: { fontSize: 15, fontWeight: '700', color: '#93000A', marginBottom: 6 },
  dangerText: { fontSize: 13, color: '#737781', marginBottom: 12 },
  dangerButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dangerButtonText: { color: '#93000A', fontSize: 15, fontWeight: '600' },
  input: { height: 50, borderWidth: 1, borderColor: '#C3C6D2', borderRadius: 14, paddingHorizontal: 16, marginBottom: 12, color: '#1A1C20', backgroundColor: '#FFFFFF' },
  dangerActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, height: 46, borderWidth: 1, borderColor: '#C3C6D2', borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#1A1C20', fontWeight: '600' },
  confirmButton: { flex: 1, height: 46, borderRadius: 23, backgroundColor: '#93000A', alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontWeight: '700' },
});
