import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSlideshow } from '../services/slideshowService';

const colors = {
  background: '#F9F9FF',
  primary: '#0D3F7E',
  primaryContainer: '#2E5797',
  outline: '#737781',
};

export default function SlideshowScreen() {
  const insets = useSafeAreaInsets();
  const [presentation, setPresentation] = useState(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getSlideshow()
      .then(({ data }) => setPresentation(data))
      .catch(() => setError('Impossible de charger la présentation.'));
  }, []);

  if (!presentation) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.primary} />}
      </View>
    );
  }

  const slides = presentation.slides || [];
  const slide = slides[index];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Présentation</Text>
        <Text style={styles.counter}>{index + 1} / {slides.length}</Text>
      </View>
      <View style={styles.slide}>
        {slide?.imageUrl ? <Image source={{ uri: slide.imageUrl }} style={styles.image} /> : null}
        <View style={styles.overlay} />
        <View style={styles.slideContent}>
          <Text style={styles.presentationTitle}>{presentation.title}</Text>
          <Text style={styles.slideTitle}>{slide?.title || 'Aucune diapositive'}</Text>
          <Text style={styles.slideText}>{slide?.content || presentation.description}</Text>
        </View>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
          <Text style={[styles.secondaryButtonText, index === 0 && styles.disabled]}>Précédente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setIndex((current) => Math.min(slides.length - 1, current + 1))} disabled={index === slides.length - 1}>
          <Text style={[styles.primaryButtonText, index === slides.length - 1 && styles.disabled]}>Suivante</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  error: { color: '#BA1A1A', paddingHorizontal: 24, textAlign: 'center' },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 24 },
  counter: { color: colors.outline, fontFamily: 'Inter_500Medium', fontSize: 13 },
  slide: { flex: 1, marginHorizontal: 20, marginBottom: 20, overflow: 'hidden', borderRadius: 24, backgroundColor: colors.primary },
  image: { ...StyleSheet.absoluteFillObject, opacity: 0.25 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.primary },
  slideContent: { flex: 1, justifyContent: 'center', padding: 28 },
  presentationTitle: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_600SemiBold', fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' },
  slideTitle: { color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', fontSize: 34, lineHeight: 41, marginTop: 16 },
  slideText: { color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter_400Regular', fontSize: 17, lineHeight: 26, marginTop: 20 },
  controls: { flexDirection: 'row', gap: 12, padding: 20 },
  secondaryButton: { flex: 1, alignItems: 'center', borderRadius: 28, backgroundColor: '#EEEDF3', paddingVertical: 16 },
  primaryButton: { flex: 1, alignItems: 'center', borderRadius: 28, backgroundColor: colors.primaryContainer, paddingVertical: 16 },
  secondaryButtonText: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
  primaryButtonText: { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  disabled: { opacity: 0.4 },
});
