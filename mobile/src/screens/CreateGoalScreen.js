import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createCategory,
  createGoal,
  createStep,
  getCategories,
  searchUnsplash,
  suggestSteps,
} from '../services/goalService';

const categoryOrder = ['Sport', 'Musique', 'Voyage', 'Finance', 'Lecture'];

const colors = {
  background: '#F9F9FF',
  surface: '#FFFFFF',
  surfaceLow: '#F3F3F9',
  surfaceContainer: '#EEEDF3',
  primary: '#0D3F7E',
  primaryContainer: '#2E5797',
  text: '#1A1C20',
  muted: '#737781',
  outline: '#C3C6D2',
  error: '#BA1A1A',
};

export default function CreateGoalScreen({ navigation }) {
  const [form, setForm] = useState({ title: '', description: '', targetDate: '', categoryId: '' });
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [steps, setSteps] = useState([]);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(({ data }) => {
        const orderedCategories = categoryOrder
          .map((name) => data.find((category) => category.name === name))
          .filter(Boolean);
        setAllCategories(data);
        setCategories(orderedCategories);
        if (orderedCategories.length) setForm((current) => ({ ...current, categoryId: orderedCategories[0].id }));
      })
      .catch((err) => setError(err.response?.data?.message || 'Impossible de charger les catégories.'));
  }, []);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setSearching(true);
    setError('');
    try {
      const { data } = await searchUnsplash(query);
      setPhotos(Array.isArray(data) ? data : []);
      if (!data?.length) setError('Aucune image trouvée pour cette recherche.');
    } catch (err) {
      setError(err.response?.data?.message || 'La recherche d’images a échoué.');
    } finally {
      setSearching(false);
    }
  };

  const handleSuggestions = async () => {
    if (!form.title.trim()) {
      setError('Renseignez le titre avant de générer des étapes.');
      return;
    }
    setSuggesting(true);
    setError('');
    try {
      const category = form.categoryId === 'other'
        ? customCategoryName.trim()
        : categories.find((item) => item.id === form.categoryId)?.name || '';
      const { data } = await suggestSteps(form.title.trim(), form.description.trim(), category);
      const suggestions = Array.isArray(data?.steps) ? data.steps : [];
      setSteps(suggestions);
      setSelectedSteps(suggestions.map((_, index) => index));
      if (!suggestions.length) setError('Aucune étape n’a été proposée.');
    } catch (err) {
      setError(err.response?.data?.message || 'La génération des étapes a échoué.');
    } finally {
      setSuggesting(false);
    }
  };

  const toggleStep = (index) => {
    setSelectedSteps((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Le titre de l’objectif est obligatoire.');
      return;
    }
    if (!form.categoryId) {
      setError('Sélectionnez une catégorie.');
      return;
    }
    if (form.categoryId === 'other' && !customCategoryName.trim()) {
      setError('Donnez un nom à votre catégorie personnalisée.');
      return;
    }
    const targetDate = form.targetDate.trim();
    if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      setError('Utilisez le format AAAA-MM-JJ pour la date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let categoryId = form.categoryId;
      if (categoryId === 'other') {
        const name = customCategoryName.trim();
        const existingCategory = allCategories.find(
          (category) => category.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const { data: category } = await createCategory({ name, color: '#6750A4', icon: 'label' });
          categoryId = category.id;
        }
      }
      const { data: goal } = await createGoal({
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId,
        imageUrl: imageUrl || null,
        targetDate: targetDate ? new Date(`${targetDate}T12:00:00`).toISOString() : null,
      });
      await Promise.all(
        selectedSteps
          .map((index) => steps[index]?.title)
          .filter(Boolean)
          .map((title) => createStep(goal.id, title))
      );
      navigation.replace('GoalDetail', { goalId: goal.id });
    } catch (err) {
      setError(err.response?.data?.message || 'La création de l’objectif a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Nouvel objectif</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderTitle}>Votre vision commence ici</Text>
              <Text style={styles.heroPlaceholderText}>Choisissez une image qui représente votre objectif.</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>TITRE DE L’OBJECTIF</Text>
          <TextInput
            style={styles.titleInput}
            value={form.title}
            onChangeText={(value) => updateForm('title', value)}
            placeholder="Explorer les Alpes suisses"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.description}
            onChangeText={(value) => updateForm('description', value)}
            placeholder="Pourquoi cet objectif est-il important pour vous ?"
            placeholderTextColor={colors.muted}
            multiline
          />

          <Text style={styles.label}>DATE CIBLE</Text>
          <TextInput
            style={styles.input}
            value={form.targetDate}
            onChangeText={(value) => updateForm('targetDate', value)}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {categories.map((category) => {
              const selected = form.categoryId === category.id;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => updateForm('categoryId', category.id)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.name}</Text>
                </Pressable>
              );
            })}
            <Pressable
              style={[styles.chip, form.categoryId === 'other' && styles.chipSelected]}
              onPress={() => updateForm('categoryId', 'other')}
            >
              <Text style={[styles.chipText, form.categoryId === 'other' && styles.chipTextSelected]}>Autre</Text>
            </Pressable>
          </ScrollView>
          {form.categoryId === 'other' && (
            <TextInput
              style={[styles.input, styles.customCategoryInput]}
              value={customCategoryName}
              onChangeText={setCustomCategoryName}
              placeholder="Nom de la catégorie"
              placeholderTextColor={colors.muted}
              autoCapitalize="sentences"
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Image d’inspiration</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, styles.searchInput]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Montagne, voyage, lecture..."
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Pressable style={styles.squareButton} onPress={handleSearch} disabled={searching}>
              {searching ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.squareButtonText}>⌕</Text>}
            </Pressable>
          </View>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
              {photos.map((photo) => (
                <Pressable key={photo.id} onPress={() => { setImageUrl(photo.url); setPhotos([]); }}>
                  <Image source={{ uri: photo.thumb }} style={styles.photo} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jalons</Text>
            <Text style={styles.sectionMeta}>{selectedSteps.length} sélectionné(s)</Text>
          </View>
          {steps.map((step, index) => {
            const selected = selectedSteps.includes(index);
            return (
              <Pressable key={`${step.title}-${index}`} style={styles.step} onPress={() => toggleStep(index)}>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.check}>✓</Text>}
                </View>
                <Text style={styles.stepText}>{step.title}</Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.outlineButton} onPress={handleSuggestions} disabled={suggesting}>
            {suggesting ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.outlineButtonText}>Générer des étapes avec l’IA</Text>
            )}
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.submitButton, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Créer mon objectif</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { color: colors.primary, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: colors.primary, fontSize: 20, lineHeight: 28, fontWeight: '600' },
  content: { paddingBottom: 48 },
  hero: { height: 220, backgroundColor: colors.surfaceContainer, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, paddingHorizontal: 36, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderTitle: { color: colors.primary, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  heroPlaceholderText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  card: { marginHorizontal: 20, marginTop: -32, padding: 24, borderRadius: 16, backgroundColor: colors.surface, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  label: { color: colors.primary, fontSize: 12, lineHeight: 16, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  titleInput: { color: colors.text, fontSize: 24, lineHeight: 32, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: colors.outline, paddingVertical: 8 },
  input: { minHeight: 52, borderRadius: 12, backgroundColor: colors.surfaceLow, color: colors.text, fontSize: 16, paddingHorizontal: 16, paddingVertical: 12 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  section: { marginTop: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: '600' },
  sectionMeta: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  chips: { gap: 8, paddingVertical: 12 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 10 },
  chipSelected: { borderColor: colors.primaryContainer, backgroundColor: colors.primaryContainer },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },
  customCategoryInput: { marginTop: 4 },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  searchInput: { flex: 1 },
  squareButton: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  squareButtonText: { color: '#FFFFFF', fontSize: 28, fontWeight: '600' },
  photos: { gap: 10, paddingTop: 12 },
  photo: { width: 112, height: 84, borderRadius: 12, backgroundColor: colors.surfaceContainer },
  step: { minHeight: 64, flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 16, borderRadius: 12, backgroundColor: colors.surface, shadowColor: '#000000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  checkbox: { width: 24, height: 24, marginRight: 16, borderRadius: 6, borderWidth: 2, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  check: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  stepText: { flex: 1, color: colors.text, fontSize: 16, lineHeight: 22 },
  outlineButton: { minHeight: 56, marginTop: 12, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.outline, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  outlineButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  error: { marginHorizontal: 20, marginTop: 24, borderRadius: 12, padding: 14, color: colors.error, backgroundColor: '#FFDAD6', fontSize: 14 },
  submitButton: { minHeight: 58, marginHorizontal: 20, marginTop: 28, borderRadius: 16, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryContainer, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.65 },
});
