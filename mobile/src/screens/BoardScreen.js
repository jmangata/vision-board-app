import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getCategories } from '../services/goalService';
import TopBar from '../components/TopBar';

// Catégories principales affichées dans l'ordre commun aux versions web et mobile.
const visibleCategoryNames = ['Sport', 'Musique', 'Voyage', 'Finance', 'Lecture'];

// Variantes utilisées pour personnaliser le message affiché après authentification.
const welcomeMessages = [
  (firstname) => `Ravi de te revoir, ${firstname} ! Prêt à avancer vers tes objectifs ?`,
  (firstname) => `Bonjour ${firstname} ! Chaque petit pas te rapproche de ta vision.`,
  (firstname) => `Heureux de te retrouver, ${firstname} ! Faisons de cette journée une réussite.`,
  (firstname) => `Bienvenue ${firstname} ! Tes ambitions méritent toute ton énergie.`,
  (firstname) => `Content de te revoir, ${firstname} ! Quel rêve vas-tu faire avancer aujourd’hui ?`,
  (firstname) => `C’est un plaisir de te retrouver, ${firstname} ! Continue sur cette belle lancée.`,
];

// Conserve les URL distantes et complète les chemins relatifs avec l'adresse de l'API.
const imageUri = (url) => {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const base = api.defaults.baseURL || '';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Carte responsive d'un objectif avec progression et étapes dépliables.
function GoalCard({ goal, onUpdate, featured, onPress }) {
  const [expanded, setExpanded] = useState(false);

  // La progression correspond au pourcentage d'étapes terminées.
  const progress = goal.steps?.length
    ? Math.round((goal.steps.filter((s) => s.isCompleted).length / goal.steps.length) * 100)
    : 0;

  // Bascule une étape puis recharge les objectifs afin de refléter la nouvelle progression.
  const handleToggleStep = async (stepId) => {
    try {
      await api.patch(`/steps/${stepId}/toggle`);
      onUpdate();
    } catch (err) {
      console.error('Erreur lors du changement de statut', err);
    }
  };

  return (
    <View style={[styles.card, featured && styles.cardFeatured]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View style={[styles.imageWrap, featured ? styles.imageWrapFeatured : styles.imageWrapNormal]}>
          {goal.imageUrl ? (
            <Image source={{ uri: imageUri(goal.imageUrl) }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={38} color="#C3C6D2" />
            </View>
          )}
          {goal.category?.name && (
            <View style={[styles.badge, { backgroundColor: goal.category.color || '#2e5797' }]}>
              <Text style={styles.badgeText}>{goal.category.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text
            style={[styles.cardTitle, featured && styles.cardTitleFeatured]}
            numberOfLines={featured ? undefined : 2}
          >
            {goal.title}
          </Text>
          {featured && <Text style={styles.featuredProgressText}>{progress}% réalisé</Text>}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded((value) => !value)}
        style={styles.stepsButton}
      >
        <Text style={styles.stepsButtonText}>
          {expanded ? 'Masquer les étapes' : `Voir les étapes (${goal.steps?.length || 0})`}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#2E5797" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.stepsList}>
          {goal.steps?.length === 0 && (
            <Text style={styles.noStepsText}>Aucune étape pour cet objectif.</Text>
          )}
          {goal.steps?.map((step) => (
            <TouchableOpacity
              key={step.id}
              activeOpacity={0.7}
              onPress={() => handleToggleStep(step.id)}
              style={styles.stepRow}
            >
              <Ionicons name={step.isCompleted ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={step.isCompleted ? '#2E5797' : '#737781'} />
              <Text
                style={[styles.stepTitle, step.isCompleted && styles.stepTitleCompleted]}
                numberOfLines={2}
              >
                {step.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// Écran principal : charge, filtre et présente les objectifs de l'utilisateur connecté.
export default function BoardScreen({ navigation }) {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [welcome, setWelcome] = useState(null);

  // Récupère les objectifs protégés par le JWT injecté dans le client API.
  const fetchGoals = () => {
    if (!token) return;
    api.get('/goals')
      .then((res) => setGoals(res.data))
      .catch((err) => {
        // Le client API traite globalement les 401 en fermant la session expirée.
        if (err.response?.status !== 401) console.error('Erreur lors du chargement des objectifs', err);
      });
  };

  // Restaure une seule fois le message préparé par la connexion ou l'inscription.
  useEffect(() => {
    AsyncStorage.getItem('pendingWelcome').then((storedWelcome) => {
      if (!storedWelcome) return;
      try {
        const parsedWelcome = JSON.parse(storedWelcome);
        if (!parsedWelcome.firstname) return;
        setWelcome({
          ...parsedWelcome,
          variant: Number.isInteger(parsedWelcome.variant) ? parsedWelcome.variant : 0,
        });
      } catch {
        setWelcome(null);
      }
    });
  }, []);

  useEffect(() => {
    if (welcome) AsyncStorage.removeItem('pendingWelcome');
  }, [welcome]);

  // Recharge les objectifs après un retour depuis la création ou le détail.
  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [token])
  );

  // Charge les catégories standards en respectant leur ordre d'affichage partagé.
  useEffect(() => {
    if (!token) return;
    getCategories()
      .then((res) => {
        const visibleCategories = visibleCategoryNames
          .map((name) => res.data.find((category) => category.name === name))
          .filter(Boolean);
        setCategories(visibleCategories);
      })
      .catch((err) => console.error('Erreur lors du chargement des catégories', err));
  }, [token]);

  if (!token) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loggedOutContainer}>
          <Text style={styles.loggedOutText}>Connecte-toi pour voir tes objectifs.</Text>
          <TouchableOpacity
            style={styles.loggedOutButton}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.loggedOutButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // « Autre » regroupe toutes les catégories personnalisées hors liste principale.
  const filteredGoals =
    activeCategory === 'all'
      ? goals
      : activeCategory === 'other'
        ? goals.filter((goal) => !visibleCategoryNames.includes(goal.category?.name))
        : goals.filter((goal) => goal.category?.id === activeCategory);

  return (
    <View style={styles.safeArea}>
      <TopBar
        title="Vision Board"
        leftIcon="menu"
        onLeftPress={() => navigation.openDrawer?.()}
        rightIcon="add-circle"
        onRightPress={() => navigation.navigate('CreateGoal')}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.main}>
          {welcome && (
            <View style={styles.welcome}>
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeTitle}>Un nouveau pas vers ta vision</Text>
                <Text style={styles.welcomeMsg}>
                  {welcomeMessages[welcome.variant % welcomeMessages.length](welcome.firstname)}
                </Text>
              </View>
              <Ionicons name="sparkles" size={64} color="rgba(255,255,255,0.12)" style={styles.welcomeIcon} />
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.welcomeClose}
                onPress={() => setWelcome(null)}
              >
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveCategory('all')}
              style={[styles.filterButton, activeCategory === 'all' && styles.filterButtonActive]}
            >
              <Text style={[styles.filterButtonText, activeCategory === 'all' && styles.filterButtonTextActive]}>
                Tout
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(category.id)}
                style={[styles.filterButton, activeCategory === category.id && styles.filterButtonActive]}
              >
                <Text style={[styles.filterButtonText, activeCategory === category.id && styles.filterButtonTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveCategory('other')}
              style={[styles.filterButton, activeCategory === 'other' && styles.filterButtonActive]}
            >
              <Text style={[styles.filterButtonText, activeCategory === 'other' && styles.filterButtonTextActive]}>
                Autre
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {goals.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={64} color="#C3C6D2" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Aucun objectif pour l'instant</Text>
              <Text style={styles.emptyText}>Commence par créer ton premier objectif !</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('CreateGoal')}
              >
                <Text style={styles.emptyButtonIcon}>+</Text>
                <Text style={styles.emptyButtonText}>Créer un objectif</Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredGoals.length > 0 && (
            <View style={styles.grid}>
              {filteredGoals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={fetchGoals}
                  featured={index === 0}
                  onPress={() => navigation.navigate('GoalDetail', { id: goal.id })}
                />
              ))}
            </View>
          )}

          {goals.length > 0 && filteredGoals.length === 0 && (
            <Text style={styles.noResults}>Aucun objectif dans cette catégorie.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#0d3f7e',
    fontSize: 22,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#0d3f7e',
  },
  main: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 112,
  },
  welcome: {
    backgroundColor: '#2e5797',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 28,
    overflow: 'hidden',
  },
  welcomeContent: {
    paddingRight: 32,
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  welcomeMsg: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  welcomeIcon: {
    position: 'absolute',
    bottom: -12,
    right: -8,
    fontSize: 72,
    color: 'rgba(255,255,255,0.1)',
  },
  welcomeClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCloseText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
  },
  filterScroll: {
    marginHorizontal: -20,
    marginBottom: 28,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 8,
  },
  filterButton: {
    height: 40,
    borderRadius: 999,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f3f9',
  },
  filterButtonActive: {
    backgroundColor: '#2e5797',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#434750',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1c20',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#737781',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 32,
    backgroundColor: '#2e5797',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  emptyButtonIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardFeatured: {
    width: '100%',
  },
  imageWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#eeedf3',
  },
  imageWrapNormal: {
    height: 160,
  },
  imageWrapFeatured: {
    height: 192,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 36,
  },
  badge: {
    position: 'absolute',
    left: 12,
    top: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1c20',
    lineHeight: 20,
    minHeight: 40,
  },
  cardTitleFeatured: {
    fontSize: 18,
    minHeight: undefined,
  },
  featuredProgressText: {
    fontSize: 12,
    color: '#737781',
    marginTop: 6,
  },
  progressTrack: {
    height: 6,
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#eeedf3',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2e5797',
  },
  stepsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,226,232,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stepsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e5797',
  },
  stepsButtonIcon: {
    fontSize: 18,
    color: '#2e5797',
  },
  stepsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,226,232,0.3)',
    padding: 12,
  },
  noStepsText: {
    fontSize: 12,
    color: '#737781',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stepIcon: {
    fontSize: 18,
    color: '#737781',
  },
  stepIconCompleted: {
    color: '#2e5797',
  },
  stepTitle: {
    flex: 1,
    fontSize: 14,
    color: '#1a1c20',
  },
  stepTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#737781',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 14,
    color: '#737781',
    paddingVertical: 64,
  },
  loggedOutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loggedOutText: {
    textAlign: 'center',
    color: '#434750',
    marginBottom: 16,
  },
  loggedOutButton: {
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 999,
    backgroundColor: '#2e5797',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggedOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
