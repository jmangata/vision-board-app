// Carte de badge alignée sur le composant web : icône, libellé, description et statut.
// Un badge non obtenu conserve son contenu lisible tout en étant visuellement atténué.
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const iconMap = { flag: 'flag', trophy: 'emoji-events', zap: 'bolt', calendar: 'calendar-month', compass: 'explore' };

export default function BadgeCard({ badge, earned }) {
  return (
    <View style={[styles.card, !earned && styles.locked]}>
      <View style={[styles.icon, earned ? styles.iconEarned : styles.iconLocked]}>
        <MaterialIcons name={iconMap[badge.icon] || 'star'} size={28} color={earned ? '#FFFFFF' : '#737781'} />
      </View>
      <Text style={styles.name}>{badge.name}</Text>
      <Text style={styles.description}>{badge.description}</Text>
      <View style={styles.status}>
        <MaterialIcons name={earned ? 'check-circle' : 'lock'} size={15} color={earned ? '#007151' : '#737781'} />
        <Text style={[styles.statusText, earned && styles.earnedText]}>{earned ? 'Obtenu' : 'Verrouillé'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 205, margin: 8, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E2E8', backgroundColor: '#FFFFFF', alignItems: 'center' },
  locked: { opacity: 0.48 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  iconEarned: { backgroundColor: '#2E5797' },
  iconLocked: { backgroundColor: '#EEEDF3' },
  name: { color: '#1A1C20', fontFamily: 'Inter_600SemiBold', fontSize: 14, textAlign: 'center' },
  description: { flex: 1, color: '#737781', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  statusText: { color: '#737781', fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  earnedText: { color: '#007151' },
});
