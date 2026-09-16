// Écran temporaire valide permettant à React Navigation de monter l'onglet Profil.
// Son contenu complet et ses validations seront ajoutés lors de l'étape dédiée.
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mon profil</Text>
      <Text style={styles.message}>La gestion du profil sera disponible prochainement.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 56, backgroundColor: '#F9F9FF' },
  title: { color: '#0D3F7E', fontSize: 24, fontWeight: '700' },
  message: { marginTop: 12, color: '#737781', fontSize: 14, lineHeight: 20 },
});
