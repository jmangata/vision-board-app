// Catalogue mobile des badges : fusionne la liste publique avec les gains du compte connecté.
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import BadgeCard from '../components/BadgeCard';
import TopBar from '../components/TopBar';
import api from '../services/api';

export default function BadgesScreen() {
  const [badges, setBadges] = useState([]);
  const [earnedIds, setEarnedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charge les deux collections en parallèle puis conserve les identifiants obtenus dans un Set.
  const loadBadges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allResponse, mineResponse] = await Promise.all([api.get('/badges'), api.get('/badges/me')]);
      setBadges(Array.isArray(allResponse.data) ? allResponse.data : []);
      setEarnedIds(new Set((Array.isArray(mineResponse.data) ? mineResponse.data : []).map((item) => item.badgeId ?? item.badge?.id)));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les badges.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadBadges(); }, [loadBadges]));

  // En-tête de FlatList : introduction et compteur calculé à partir des données fusionnées.
  const header = (
    <View style={styles.introduction}>
      <Text style={styles.intro}>Atteins des objectifs et crée des habitudes pour débloquer de nouveaux badges.</Text>
      <View style={styles.counter}><MaterialIcons name="military-tech" size={20} color="#2E5797" /><Text style={styles.counterText}>{earnedIds.size} badge{earnedIds.size > 1 ? 's' : ''} obtenu{earnedIds.size > 1 ? 's' : ''} sur {badges.length}</Text></View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <TopBar title="Badges" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2E5797" /><Text style={styles.loadingText}>Chargement des badges...</Text></View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#93000A" />
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBadges}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={badges}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          renderItem={({ item }) => <BadgeCard badge={item} earned={earnedIds.has(item.id)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="military-tech" size={52} color="#C3C6D2" /><Text style={styles.emptyTitle}>Aucun badge disponible</Text><Text style={styles.emptyText}>Les prochains badges apparaîtront ici.</Text></View>}
          contentContainerStyle={styles.list}
          columnWrapperStyle={badges.length ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F9FF' },
  list: { paddingHorizontal: 12, paddingBottom: 112 },
  introduction: { paddingHorizontal: 8, paddingTop: 24, paddingBottom: 12 },
  intro: { color: '#737781', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  counter: { alignSelf: 'flex-start', marginTop: 16, paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: '#EEEDF3', flexDirection: 'row', alignItems: 'center', gap: 7 },
  counterText: { color: '#0D3F7E', fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  row: { alignItems: 'stretch' },
  center: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#737781', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 14 },
  error: { color: '#93000A', fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, marginTop: 14, textAlign: 'center' },
  retryButton: { minWidth: 128, height: 48, marginTop: 20, borderRadius: 24, backgroundColor: '#2E5797', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  empty: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 64 },
  emptyTitle: { color: '#1A1C20', fontFamily: 'Inter_600SemiBold', fontSize: 17, marginTop: 14 },
  emptyText: { color: '#737781', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 6 },
});
