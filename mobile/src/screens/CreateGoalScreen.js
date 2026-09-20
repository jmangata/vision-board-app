// Formulaire mobile de création d'objectif, fidèle à la version web responsive.
// Il gère les catégories, l'image, la date et les étapes suggérées par Groq.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createCategory, createGoal, createStep, getCategories, searchUnsplash, suggestSteps, uploadImage } from '../services/goalService';
import { notifyGoalCreated, scheduleGoalReminder } from '../services/notificationService';
import TopBar from '../components/TopBar';

const categoryOrder = ['Sport', 'Musique', 'Voyage', 'Finance', 'Lecture'];
const categoryIcons = { dumbbell: 'fitness-center', 'music-note': 'music-note', map: 'flight', 'dollar-sign': 'payments', book: 'menu-book', 'book-open': 'menu-book' };
const colors = { background: '#F9F9FF', surface: '#FFFFFF', surfaceLow: '#F3F3F9', surfaceContainer: '#EEEDF3', primary: '#0D3F7E', primaryContainer: '#2E5797', text: '#1A1C20', muted: '#737781', outline: '#C3C6D2', error: '#BA1A1A' };

export default function CreateGoalScreen({ navigation }) {
  // États du formulaire et des catégories disponibles.
  const [form, setForm] = useState({ title: '', description: '', targetDate: '', categoryId: '' });
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // États de sélection, d'import et de recherche de l'image de couverture.
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [showUnsplashSearch, setShowUnsplashSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);

  // États des suggestions Groq et des traitements asynchrones.
  const [steps, setSteps] = useState([]);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charge les catégories dans le même ordre que le formulaire web.
  useEffect(() => {
    getCategories().then(({ data }) => {
      const ordered = categoryOrder.map((name) => data.find((category) => category.name === name)).filter(Boolean);
      setAllCategories(data);
      setCategories(ordered);
      if (ordered.length) setForm((current) => ({ ...current, categoryId: ordered[0].id }));
    }).catch((err) => setError(err.response?.data?.message || 'Impossible de charger les catégories.'));
  }, []);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  // Ouvre la photothèque, puis envoie l'image choisie vers Cloudinary via le backend.
  const handleImageUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorise l'accès aux photos pour importer une image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (result.canceled) return;
    setUploading(true);
    setError('');
    try {
      const asset = result.assets[0];
      const { data } = await uploadImage(asset);
      setImageUrl(data.imageUrl);
      setSelectedFileName(asset.fileName || 'Image importée');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'import de l'image.");
    } finally {
      setUploading(false);
    }
  };

  // Recherche des images libres de droits à partir du mot-clé saisi.
  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setError('Saisis un mot-clé pour rechercher une image.');
      return;
    }
    setSearching(true);
    setError('');
    try {
      const { data } = await searchUnsplash(query);
      const results = Array.isArray(data) ? data : [];
      setPhotos(results);
      if (!results.length) setError('Aucune image trouvée pour cette recherche.');
    } catch (err) {
      setPhotos([]);
      setError(err.response?.data?.message || 'La recherche Unsplash a échoué.');
    } finally {
      setSearching(false);
    }
  };

  // Demande à Groq des étapes adaptées au titre, à la description et à la catégorie.
  const handleSuggestions = async () => {
    if (!form.title.trim()) {
      setError('Renseigne d’abord le titre de l’objectif.');
      return;
    }
    setSuggesting(true);
    setError('');
    try {
      const category = form.categoryId === 'other' ? customCategoryName.trim() : categories.find((item) => item.id === form.categoryId)?.name || '';
      const { data } = await suggestSteps(form.title.trim(), form.description.trim(), category);
      const suggestions = Array.isArray(data?.steps) ? data.steps : [];
      setSteps(suggestions);
      setSelectedSteps(suggestions.map((_, index) => index));
      if (!suggestions.length) setError('Aucune étape n’a été proposée.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suggestion d’étapes.');
    } finally {
      setSuggesting(false);
    }
  };

  const toggleStep = (index) => setSelectedSteps((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);

  // Résout la catégorie personnalisée, crée l'objectif puis ses étapes sélectionnées.
  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Le titre de l’objectif est obligatoire.');
    if (!form.categoryId) return setError('Sélectionne une catégorie.');
    if (form.categoryId === 'other' && !customCategoryName.trim()) return setError('Donne un nom à ta catégorie personnalisée.');
    const targetDate = form.targetDate.trim();
    if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return setError('Utilise le format AAAA-MM-JJ pour la date.');
    setLoading(true);
    setError('');
    try {
      let categoryId = form.categoryId;
      if (categoryId === 'other') {
        const name = customCategoryName.trim();
        const existing = allCategories.find((category) => category.name.trim().toLowerCase() === name.toLowerCase());
        categoryId = existing?.id || (await createCategory({ name, color: '#6750A4', icon: 'label' })).data.id;
      }
      const { data: goal } = await createGoal({ title: form.title.trim(), description: form.description.trim(), categoryId, imageUrl: imageUrl || null, targetDate: targetDate ? new Date(`${targetDate}T12:00:00`).toISOString() : null });
      await Promise.all(selectedSteps.map((index) => steps[index]?.title).filter(Boolean).map((title) => createStep(goal.id, title)));
      // Notification immédiate de confirmation + rappel local la veille de l'échéance.
      await notifyGoalCreated(goal.title);
      await scheduleGoalReminder(goal);
      navigation.replace('GoalDetail', { id: goal.id });
    } catch (err) {
      setError(err.response?.data?.message || 'La création de l’objectif a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title="Nouvel objectif" leftIcon="close" onLeftPress={() => navigation.goBack()} />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Titre de l'objectif</Text>
          <TextInput style={[styles.input, styles.tallInput]} value={form.title} onChangeText={(value) => updateForm('title', value)} placeholder="Ex: Courir un marathon" placeholderTextColor={colors.muted} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.description]} value={form.description} onChangeText={(value) => updateForm('description', value)} placeholder="Pourquoi cet objectif est-il important ?" placeholderTextColor={colors.muted} multiline />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, styles.categoryLabel]}>Catégorie</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const selected = form.categoryId === category.id;
              return <Pressable key={category.id} style={[styles.categoryCard, selected && styles.categoryCardSelected]} onPress={() => updateForm('categoryId', category.id)}><MaterialIcons name={categoryIcons[category.icon] || 'label'} size={30} color={colors.primaryContainer} /><Text style={styles.categoryText}>{category.name}</Text></Pressable>;
            })}
            <Pressable style={[styles.categoryCard, form.categoryId === 'other' && styles.categoryCardSelected]} onPress={() => updateForm('categoryId', 'other')}><MaterialIcons name="add" size={28} color={colors.primaryContainer} /><Text style={styles.categoryText}>Autre</Text></Pressable>
          </View>
          {form.categoryId === 'other' && <View style={styles.customCategory}><Text style={styles.smallLabel}>Nom de la catégorie</Text><TextInput style={styles.input} value={customCategoryName} onChangeText={setCustomCategoryName} placeholder="Ex : Cuisine, Musique, Jardinage..." placeholderTextColor={colors.muted} /><Text style={styles.hint}>Indique le thème qui correspond à cet objectif.</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Image de couverture</Text>
          {imageUrl ? <View style={styles.preview}><Image source={{ uri: imageUrl }} style={styles.previewImage} /><Pressable style={styles.removeImage} onPress={() => { setImageUrl(''); setSelectedFileName(''); }}><MaterialIcons name="close" size={22} color={colors.primary} /></Pressable></View> : null}
          <View style={styles.imageChoices}>
            <Pressable style={styles.imageChoice} onPress={handleImageUpload} disabled={uploading}>{uploading ? <ActivityIndicator color={colors.primary} /> : <MaterialIcons name="add-a-photo" size={38} color={colors.muted} />}<Text style={styles.imageChoiceText}>{uploading ? 'Import en cours...' : 'Importer'}</Text>{selectedFileName ? <Text numberOfLines={1} style={styles.fileName}>{selectedFileName}</Text> : null}</Pressable>
            <Pressable style={[styles.imageChoice, showUnsplashSearch && styles.imageChoiceSelected]} onPress={() => setShowUnsplashSearch((current) => !current)}><MaterialIcons name="search" size={38} color={showUnsplashSearch ? colors.primary : colors.muted} /><Text style={styles.imageChoiceText}>Recherche Unsplash</Text></Pressable>
          </View>
          {showUnsplashSearch && <View style={styles.unsplashPanel}><View style={styles.searchRow}><TextInput style={[styles.input, styles.searchInput]} value={searchQuery} onChangeText={setSearchQuery} placeholder="Montagne, voyage, lecture..." placeholderTextColor={colors.muted} returnKeyType="search" onSubmitEditing={handleSearch} /><Pressable style={styles.searchButton} onPress={handleSearch} disabled={searching}>{searching ? <ActivityIndicator color="#FFFFFF" /> : <MaterialIcons name="search" size={24} color="#FFFFFF" />}</Pressable></View>{photos.length > 0 && <View style={styles.photos}>{photos.map((photo) => <Pressable key={photo.id} style={styles.photoButton} onPress={() => { setImageUrl(photo.url); setSelectedFileName(''); setPhotos([]); setShowUnsplashSearch(false); }}><Image source={{ uri: photo.thumb }} style={styles.photo} /></Pressable>)}</View>}</View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date d'échéance (optionnel)</Text>
          <TextInput style={[styles.input, styles.tallInput]} value={form.targetDate} onChangeText={(value) => updateForm('targetDate', value)} placeholder="AAAA-MM-JJ" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" maxLength={10} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.label}>Étapes suggérées</Text>
          <Text style={styles.hint}>Groq peut te proposer des étapes basées sur ton objectif.</Text>
          <Pressable style={styles.suggestButton} onPress={handleSuggestions} disabled={suggesting}>{suggesting ? <ActivityIndicator color={colors.primary} /> : <View style={styles.buttonContent}><MaterialIcons name="auto-awesome" size={22} color={colors.primaryContainer} /><Text style={styles.suggestText}>Suggérer des étapes</Text></View>}</Pressable>
          {steps.length > 0 && <View style={styles.steps}><Text style={styles.hint}>Sélectionne les étapes à conserver :</Text>{steps.map((step, index) => { const selected = selectedSteps.includes(index); return <Pressable key={`${step.title}-${index}`} style={styles.step} onPress={() => toggleStep(index)}><MaterialIcons name={selected ? 'check-box' : 'check-box-outline-blank'} size={25} color={selected ? colors.primaryContainer : colors.muted} /><Text style={styles.stepText}>{step.title}</Text></Pressable>; })}</View>}
        </View>

        <Pressable style={[styles.submitButton, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <View style={styles.buttonContent}><Text style={styles.submitText}>Créer l'objectif</Text><MaterialIcons name="auto-awesome" size={22} color="#FFFFFF" /></View>}</Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { height: 80, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(249,249,255,0.96)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  headerButton: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerSpacer: { width: 24 },
  headerTitle: { color: colors.primary, fontSize: 20, fontFamily: 'Inter_700Bold' },
  content: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 112, gap: 32 },
  section: { width: '100%' },
  label: { color: colors.muted, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  smallLabel: { color: colors.muted, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { minHeight: 56, borderRadius: 16, backgroundColor: colors.surfaceLow, color: colors.text, fontSize: 16, fontWeight: '500', paddingHorizontal: 20, paddingVertical: 14 },
  tallInput: { height: 80, fontSize: 18 },
  description: { minHeight: 128, textAlignVertical: 'top', paddingTop: 20 },
  categoryLabel: { marginBottom: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  categoryCard: { width: '47.5%', height: 112, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  categoryCardSelected: { borderColor: colors.primaryContainer, backgroundColor: '#F4F7FF' },
  categoryText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  customCategory: { marginTop: 12 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  preview: { width: '100%', aspectRatio: 16 / 9, marginBottom: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surfaceContainer },
  previewImage: { width: '100%', height: '100%' },
  removeImage: { position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  imageChoices: { flexDirection: 'row', gap: 16 },
  imageChoice: { flex: 1, aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.outline, alignItems: 'center', justifyContent: 'center', padding: 12 },
  imageChoiceSelected: { borderColor: colors.primaryContainer, backgroundColor: '#F4F7FF' },
  imageChoiceText: { color: colors.muted, fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 12 },
  fileName: { maxWidth: '80%', color: colors.muted, fontSize: 11, marginTop: 4 },
  unsplashPanel: { marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.surfaceLow },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, minWidth: 0, backgroundColor: colors.surface },
  searchButton: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12, rowGap: 12 },
  photoButton: { width: '48%', aspectRatio: 4 / 3, borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  error: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: colors.error, backgroundColor: '#FFDAD6', fontSize: 14, fontWeight: '500' },
  suggestButton: { height: 80, width: '100%', borderRadius: 40, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  suggestText: { color: colors.primaryContainer, fontSize: 18, fontWeight: '700' },
  steps: { marginTop: 12, gap: 8 },
  step: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, backgroundColor: colors.surface },
  stepText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  submitButton: { height: 80, width: '100%', borderRadius: 40, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryContainer, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  submitText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  disabled: { opacity: 0.65 },
});
