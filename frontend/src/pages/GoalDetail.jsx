// Page de détail d'un objectif : progression, gestion des étapes
// (ajout, coche, suppression), changement d'image de couverture
// (upload ou Unsplash) et suppression de l'objectif.
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGoal, deleteGoal, createStep, toggleStep, deleteStep, updateGoal, uploadImage } from '../services/goalService.js';
import api from '../services/api.js';

const iconMap = {
  book: 'menu_book',
  briefcase: 'work',
  'dollar-sign': 'payments',
  users: 'groups',
  heart: 'favorite',
  map: 'flight',
};

function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [newStep, setNewStep] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [stepError, setStepError] = useState('');

  // Recharge l'objectif complet après chaque modification
  // (les steps sont inclus dans la réponse du backend)
  const fetchGoal = () => {
    getGoal(id).then((res) => setGoal(res.data));
  };

  // Applique une nouvelle image de couverture (upload ou Unsplash)
  // puis referme le sélecteur d'image
  const applyImage = async (imageUrl) => {
    setImageError('');
    try {
      const { data } = await updateGoal(id, { imageUrl });
      setGoal((g) => ({ ...g, imageUrl: data.imageUrl }));
      setShowImagePicker(false);
      setPhotos([]);
      setSearchQuery('');
    } catch (err) {
      setImageError(err.response?.data?.message || "Erreur lors de la mise à jour de l'image");
    }
  };

  const searchImages = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get(`/unsplash/search?query=${searchQuery}`);
      setPhotos(res.data);
    } catch (err) {
      setImageError('Erreur lors de la recherche Unsplash');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Veuillez sélectionner une image.');
      return;
    }
    setUploading(true);
    setImageError('');
    try {
      const { data } = await uploadImage(file);
      await applyImage(data.imageUrl);
    } catch (err) {
      setImageError(err.response?.data?.message || "Erreur lors de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [id]);

 const handleAddStep = async (e) => {
  e.preventDefault();
  setStepError('');

  const title = newStep.trim();
  if (!title) return;

  // Met une majuscule au premier caractère pour une présentation homogène
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
      await toggleStep(stepId);
      fetchGoal();
    } catch (err) {
      setStepError(err.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Supprimer cette étape ?')) return;
    setStepError('');
    try {
      await deleteStep(stepId);
      fetchGoal();
    } catch (err) {
      setStepError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cet objectif et toutes ses étapes ?')) return;
    setStepError('');
    try {
      await deleteGoal(id);
      navigate('/');
    } catch (err) {
      setStepError(err.response?.data?.message || 'Erreur lors de la suppression de l\'objectif');
    }
  };

  if (!goal) return <p className="p-5">Chargement...</p>;

  // Progression = pourcentage d'étapes terminées
  const completed = goal.steps.filter((s) => s.isCompleted).length;
  const total = goal.steps.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md h-16 flex justify-between items-center px-5">
        <Link to="/" className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-semibold text-primary">Détail de l'objectif</h1>
        <button onClick={handleDelete} className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-error">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </header>

      <main className="mt-16 px-5">
        <div className="relative w-full h-64 overflow-hidden bg-surface-container rounded-3xl shadow-lg">
          {goal.imageUrl ? (
            <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant">landscape</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <button
            type="button"
            onClick={() => setShowImagePicker((v) => !v)}
            className="absolute top-3 right-3 flex items-center gap-2 bg-white/90 text-primary text-sm font-semibold px-4 py-2 rounded-full shadow-lg"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Changer l'image
          </button>
        </div>

        <div className="-mt-10 relative z-10">
          <div className="card p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="bg-primary-container text-on-primary rounded-full px-3 py-1 text-xs font-semibold inline-block mb-2">
                  {goal.category?.name}
                </span>
                <h2 className="text-xl font-bold text-on-surface">{goal.title}</h2>
              </div>
              <div className="bg-surface-container-low text-primary p-2 rounded-lg">
                <span className="material-symbols-outlined">
                  {iconMap[goal.category?.icon] || 'label'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-end mb-1">
                <p className="text-sm font-semibold text-primary">Progression globale</p>
                <p className="text-2xl font-bold text-primary">{progress}%</p>
              </div>
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container shadow-progress transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {showImagePicker && (
          <div className="card p-4 mt-4">
            {imageError && <p className="text-error text-sm font-medium mb-2">{imageError}</p>}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="mb-3 text-sm text-outline file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-white hover:file:bg-primary-container/90"
            />
            {uploading && <p className="text-xs text-outline mb-2">Téléchargement en cours...</p>}

            <div className="flex gap-2 mb-3">
              <input
                placeholder="Rechercher sur Unsplash..."
                className="input-field flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchImages())}
              />
              <button type="button" onClick={searchImages} className="w-12 h-14 bg-primary-container text-white rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <button
                    type="button"
                    key={photo.id}
                    onClick={() => applyImage(photo.url)}
                    className="rounded-xl overflow-hidden border-2 border-transparent hover:border-primary-container transition-all"
                  >
                    <img src={photo.thumb} alt={photo.alt} className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <section className="px-5 mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-on-surface">Étapes</h3>
            <span className="text-xs text-outline">{completed} sur {total} étape(s) terminée(s)</span>
          </div>
    <p className="text-xs text-outline mb-3">
  Clique sur une étape pour la valider. Ajoute des étapes petites et actionnables.
</p>
          <form onSubmit={handleAddStep} className="flex gap-2 mb-4">
            <input
              placeholder="Ajouter une étape"
              className="flex-1 input-field"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
            />
            <button className="w-12 h-14 bg-primary-container text-white rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">add</span>
            </button>
          </form>

          {stepError && <p className="text-error text-sm font-medium mb-3">{stepError}</p>}

          <div className="space-y-3">
            {goal.steps.map((step) => (
              <div
                key={step.id}
                onClick={() => handleToggle(step.id)}
                className="flex items-center p-4 bg-surface-container-lowest rounded-xl shadow-soft border border-transparent hover:border-primary-container transition-all cursor-pointer"
              >
                <div className={`w-6 h-6 rounded-md mr-4 flex items-center justify-center ${
                  step.isCompleted ? 'bg-primary text-on-primary' : 'border-2 border-outline-variant'
                }`}>
                  {step.isCompleted && <span className="material-symbols-outlined text-sm">check</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${step.isCompleted ? 'text-outline line-through' : 'text-on-surface'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-outline-variant">
                    {step.isCompleted ? `Terminée le ${new Date(step.completedAt).toLocaleDateString('fr-FR')}` : 'En cours'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }}
                  className="ml-3 w-9 h-9 rounded-full flex items-center justify-center text-outline hover:bg-error-container hover:text-error transition-colors"
                  aria-label="Supprimer l'étape"
                  title="Supprimer l'étape"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default GoalDetail;