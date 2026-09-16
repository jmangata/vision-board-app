// Écran temporaire valide permettant à React Navigation de monter l'onglet Badges.
// Son contenu complet sera harmonisé avec le responsive web lors de l'étape dédiée.
import { StyleSheet, Text, View } from 'react-native';

export default function BadgesScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mes badges</Text>
      <Text style={styles.message}>Les badges seront disponibles prochainement.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 56, backgroundColor: '#F9F9FF' },
  title: { color: '#0D3F7E', fontSize: 24, fontWeight: '700' },
  message: { marginTop: 12, color: '#737781', fontSize: 14, lineHeight: 20 },
});
