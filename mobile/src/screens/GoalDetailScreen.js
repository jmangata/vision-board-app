import { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { createStep, searchUnsplash } from '../services/goalService';

const iconMap = {
  book: 'book',
  briefcase: 'briefcase',
  'dollar-sign': 'dollar',
  users: 'users',
  heart: 'heart',
  map: 'map',
};

const colors = {
  background: '#f9f9ff',
  surface: '#f9f9ff',
  surfaceLow: '#f3f3f9',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#eeedf3',
  primary: '#0d3f7e',
  onPrimary: '#ffffff',
  primaryContainer: '#2e5797',
  onSurface: '#1a1c20',
  onSurfaceVariant: '#434750',
  outline: '#737781',
  outlineVariant: '#c3c6d2',
  error: '#ba1a1a',
};

export default function GoalDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params;

  const [goal, setGoal] = useState(null);
  const [newStep, setNewStep] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageError, setImageError] = useState('');
  const [stepError, setStepError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchGoal = () => {
    api.get(`/goals/${id}`).then((res) => setGoal(res.data));
  };

  const applyImage = async (imageUrl) => {
    setImageError('');
    try {
      const { data } = await api.put(`/goals/${id}`, { imageUrl });
      setGoal((g) => ({ ...g, imageUrl: data.imageUrl }));
      setShowImagePicker(false);
      setPhotos([]);
      setSearchQuery('');
      setImageUrlInput('');
    } catch (err) {
      setImageError(err.response?.data?.message || "Erreur lors de la mise à jour de l'image");
    }
  };

  const searchImages = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await searchUnsplash(searchQuery);
      setPhotos(res.data);
    } catch (err) {
      setImageError('Erreur lors de la recherche Unsplash');
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [id]);

  const handleAddStep = async () => {
    setStepError('');
    const title = newStep.trim();
    if (!title) return;
    const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
    try {
      await createStep(id, formattedTitle);
      setNewStep('');
      fetchGoal();
    } catch (err) {
      setStepError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'étape');
    }
  };

  const handleToggle = async (stepId) => {
    setStepError('');
    try {
      await api.patch(`/steps/${stepId}/toggle`);
      fetchGoal();
    } catch (err) {
      setStepError(err.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteStep = (stepId) => {
    Alert.alert(
      'Confirmer',
      'Supprimer cette étape ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setStepError('');
            try {
              await api.delete(`/steps/${stepId}`);
              fetchGoal();
            } catch (err) {
              setStepError(err.response?.data?.message || 'Erreur lors de la suppression');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer',
      'Supprimer cet objectif et toutes ses étapes ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setStepError('');
            try {
              await api.delete(`/goals/${id}`);
              navigation.goBack();
            } catch (err) {
              setStepError(err.response?.data?.message || 'Erreur lors de la suppression de l\'objectif');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!goal) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Chargement...</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const completed = goal.steps.filter((s) => s.isCompleted).length;
  const total = goal.steps.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { height: 64 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail de l'objectif</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
          <MaterialIcons name="delete" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.imageCard}>
          {goal.imageUrl ? (
            <Image source={{ uri: goal.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Aucune image</Text>
            </View>
          )}
          <View style={styles.imageOverlay} />
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={() => setShowImagePicker((v) => !v)}
          >
            <Text style={styles.changeImageButtonText}>Changer l'image</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoHeaderLeft}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{goal.category?.name}</Text>
              </View>
              <Text style={styles.title}>{goal.title}</Text>
            </View>
            <View style={styles.iconBox}>
              <Text style={styles.iconBoxText}>{iconMap[goal.category?.icon] || 'label'}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Progression globale</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        {showImagePicker && (
          <View style={styles.pickerCard}>
            {imageError ? <Text style={styles.errorText}>{imageError}</Text> : null}

            <View style={styles.urlRow}>
              <TextInput
                style={[styles.input, styles.urlInput]}
                placeholder="URL de l'image"
                value={imageUrlInput}
                onChangeText={setImageUrlInput}
              />
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => applyImage(imageUrlInput)}
              >
                <Text style={styles.smallButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.orText}>— ou —</Text>

            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, styles.searchInput]}
                placeholder="Rechercher sur Unsplash..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchImages}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.smallButton} onPress={searchImages}>
                <Text style={styles.smallButtonText}>OK</Text>
              </TouchableOpacity>
            </View>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoButton}
                    onPress={() => applyImage(photo.url)}
                  >
                    <Image source={{ uri: photo.thumb }} style={styles.photoThumb} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.stepsSection}>
          <View style={styles.stepsHeader}>
            <Text style={styles.stepsTitle}>Étapes</Text>
            <Text style={styles.stepsCount}>{completed} sur {total} étape(s) terminée(s)</Text>
          </View>
          <Text style={styles.stepsHint}>
            Clique sur une étape pour la valider. Ajoute des étapes petites et actionnables.
          </Text>

          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.addInput]}
              placeholder="Ajouter une étape"
              value={newStep}
              onChangeText={setNewStep}
              onSubmitEditing={handleAddStep}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddStep}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {stepError ? <Text style={styles.errorText}>{stepError}</Text> : null}

          <View style={styles.stepsList}>
            {goal.steps.map((step) => (
              <View key={step.id} style={styles.stepRow}>
                <TouchableOpacity
                  style={styles.stepTouchable}
                  onPress={() => handleToggle(step.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      step.isCompleted ? styles.checkboxCompleted : styles.checkboxPending,
                    ]}
                  >
                    {step.isCompleted ? <Text style={styles.checkText}>✓</Text> : null}
                  </View>
                  <View style={styles.stepText}>
                    <Text
                      style={[
                        styles.stepTitle,
                        step.isCompleted && styles.stepTitleCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {step.title}
                    </Text>
                    <Text style={styles.stepMeta}>
                      {step.isCompleted
                        ? `Terminée le ${new Date(step.completedAt).toLocaleDateString('fr-FR')}`
                        : 'En cours'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteStepButton}
                  onPress={() => handleDeleteStep(step.id)}
                >
                  <Text style={styles.deleteStepText}>Suppr</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  loadingText: {
    color: colors.onSurface,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(249,249,255,0.96)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  imageCard: {
    height: 256,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: colors.surfaceContainer,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: colors.outlineVariant,
    fontSize: 14,
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  changeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changeImageButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: 16,
    padding: 20,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  infoHeaderLeft: {
    flex: 1,
    paddingRight: 12,
  },
  categoryBadge: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryBadgeText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  iconBox: {
    backgroundColor: colors.surfaceLow,
    padding: 10,
    borderRadius: 10,
  },
  iconBoxText: {
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressSection: {
    marginTop: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressTrack: {
    height: 12,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryContainer,
  },
  pickerCard: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  orText: {
    textAlign: 'center',
    color: colors.outline,
    marginVertical: 8,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.onSurface,
  },
  urlInput: {
    flex: 1,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  smallButton: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButtonText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  photoButton: {
    width: '31%',
    height: 80,
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  stepsSection: {
    marginTop: 24,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
  },
  stepsCount: {
    fontSize: 12,
    color: colors.outline,
  },
  stepsHint: {
    fontSize: 12,
    color: colors.outline,
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 24,
    fontWeight: '600',
  },
  stepsList: {
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.surfaceLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  stepTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxCompleted: {
    backgroundColor: colors.primary,
  },
  checkboxPending: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  checkText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.onSurface,
  },
  stepTitleCompleted: {
    color: colors.outline,
    textDecorationLine: 'line-through',
  },
  stepMeta: {
    fontSize: 12,
    color: colors.outlineVariant,
    marginTop: 2,
  },
  deleteStepButton: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  deleteStepText: {
    color: colors.outline,
    fontSize: 13,
  },
});
