import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import TopBar from '../components/TopBar';
import api from '../services/api';

const cards = [
  { key: 'totalGoals', label: 'Objectifs totaux', icon: 'flag' },
  { key: 'completedGoals', label: 'Terminés', icon: 'task-alt' },
  { key: 'activeGoals', label: 'En cours', icon: 'pending-actions' },
  { key: 'completionRate', label: 'Complétion', icon: 'donut-large', suffix: '%' },
];

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/dashboard');
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  return (
    <View style={styles.screen}>
      <TopBar title="Tableau de bord" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2E5797" /><Text style={styles.loadingText}>Chargement des statistiques...</Text></View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color="#93000A" />
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStats}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.intro}>Voici un récapitulatif de ta progression et de tes accomplissements.</Text>
          <View style={styles.grid}>
            {cards.map((card) => (
              <View key={card.key} style={styles.statCard}>
                <MaterialIcons name={card.icon} size={24} color="#2E5797" />
                <Text style={styles.statLabel}>{card.label}</Text>
                <Text style={styles.statValue}>{stats?.[card.key] ?? 0}{card.suffix}</Text>
              </View>
            ))}
          </View>
          <View style={styles.badgeCard}>
            <View style={styles.badgeIcon}><MaterialIcons name="military-tech" size={30} color="#FFFFFF" /></View>
            <View style={styles.badgeCopy}><Text style={styles.badgeLabel}>Badges obtenus</Text><Text style={styles.badgeHint}>Tes accomplissements débloqués</Text></View>
            <Text style={styles.badgeValue}>{stats?.totalBadges ?? 0}</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F9FF' },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 112 },
  intro: { color: '#737781', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  statCard: { width: '47.5%', minHeight: 140, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E2E8', backgroundColor: '#FFFFFF' },
  statLabel: { color: '#737781', fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 14 },
  statValue: { color: '#0D3F7E', fontFamily: 'Inter_700Bold', fontSize: 28, marginTop: 4 },
  badgeCard: { minHeight: 100, marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E2E8', flexDirection: 'row', alignItems: 'center' },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2E5797', alignItems: 'center', justifyContent: 'center' },
  badgeCopy: { flex: 1, marginLeft: 14 },
  badgeLabel: { color: '#1A1C20', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  badgeHint: { color: '#737781', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  badgeValue: { color: '#0D3F7E', fontFamily: 'Inter_700Bold', fontSize: 30 },
  center: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#737781', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 14 },
  error: { color: '#93000A', fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, marginTop: 14, textAlign: 'center' },
  retryButton: { minWidth: 128, height: 48, marginTop: 20, borderRadius: 24, backgroundColor: '#2E5797', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
