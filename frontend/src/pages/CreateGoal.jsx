// CreateGoal.jsx : formulaire de création d'un nouvel objectif.
// Permet de renseigner le titre, la description, une date cible, une catégorie,
// une image de couverture (upload ou recherche Unsplash) et des étapes suggérées par IA.
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { createGoal, uploadImage,suggestSteps } from '../services/goalService.js';

const categoryOrder = ['Sport', 'Musique', 'Voyage', 'Finance', 'Lecture'];

function CreateGoal() {
  // Catégories disponibles pour le choix du thème.
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  // Valeurs du formulaire principal.
  const [form, setForm] = useState({ title: '', description: '', targetDate: '', categoryId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gestion de l'image de couverture.
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [searchingImages, setSearchingImages] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [showUnsplashSearch, setShowUnsplashSearch] = useState(false);

  // Gestion des étapes suggérées par l'IA.
  const [suggestedSteps, setSuggestedSteps] = useState([]);
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Gestion de la catégorie personnalisée "Autre".
  const [customCategoryName, setCustomCategoryName] = useState('');

  const navigate = useNavigate();

  // Charge les catégories au montage et pré-sélectionne la première par défaut.
  useEffect(() => {
    api.get('/categories').then((res) => {
      const orderedCategories = categoryOrder
        .map((name) => res.data.find((category) => category.name === name))
        .filter(Boolean);
      setAllCategories(res.data);
      setCategories(orderedCategories);
      if (orderedCategories.length) setForm((f) => ({ ...f, categoryId: orderedCategories[0].id }));
    });
  }, []);

// Recherche des images libres de droits sur Unsplash à partir du terme saisi.
const searchImages = async () => {
  const query = searchQuery.trim();
  if (!query) {
    setError('Saisis un mot-clé pour rechercher une image.');
    return;
  }
  setSearchingImages(true);
  setError('');
  try {
    const res = await api.get('/unsplash/search', { params: { query } });
    const results = Array.isArray(res.data) ? res.data : [];
    setPhotos(results);
    if (!results.length) setError('Aucune image trouvée pour cette recherche.');
  } catch (err) {
    setPhotos([]);
    setError(err.response?.data?.message || 'La recherche Unsplash a échoué.');
  } finally {
    setSearchingImages(false);
  }
};

  // Soumission du formulaire : gère la catégorie personnalisée, crée l'objectif,
  // ajoute les étapes sélectionnées puis redirige vers l'accueil.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
     let categoryId = form.categoryId;

// Création d'une nouvelle catégorie si l'utilisateur a choisi "Autre".
if (categoryId === 'other') {
  const trimmedName = customCategoryName.trim();
  if (!trimmedName) {
    setError('Donne un nom à ta catégorie personnalisée.');
    setLoading(false);
    return;
  }

  const existingCategory = allCategories.find(
    // Normalise la comparaison pour éviter les doublons par casse ou espaces.
    (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  // Réutilise une catégorie existante ou crée la nouvelle catégorie personnalisée.
  if (existingCategory) {
    categoryId = existingCategory.id;
  } else {
    const { data: category } = await api.post('/categories', {
      name: trimmedName,
      color: '#6750A4',
      icon: 'label',
    });
    categoryId = category.id;
  }
}

  // Prépare le payload final avec conversion de la date en format ISO si elle est renseignée.
  const payload = {
    ...form,
    categoryId,
    imageUrl,
    targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
  };
  const { data: goal } = await api.post('/goals', payload);

  // Crée chaque étape suggérée sélectionnée par l'utilisateur.
  for (const index of selectedSteps) {
    const step = suggestedSteps[index];
    if (step?.title) {
      await api.post(`/goals/${goal.id}/steps`, { title: step.title });
    }
  }

  navigate('/');
} catch (err) {
  setError(err.response?.data?.message || "Erreur lors de la création de l'objectif");
} finally {
  setLoading(false);
}
  };

  // Correspondance entre les icônes de catégorie et les noms Material Symbols.
  const iconMap = {
    book: 'menu_book',
    'book-open': 'menu_book',
    briefcase: 'work',
    'dollar-sign': 'payments',
    users: 'groups',
    heart: 'favorite',
    map: 'flight',
    dumbbell: 'fitness_center',
    'music-note': 'music_note',
  };

  // Upload d'une image depuis l'appareil de l'utilisateur.
  const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    setError('Veuillez sélectionner une image.');
    return;
  }

  setSelectedFileName(file.name);
  setUploading(true);
  setError('');
  try {
    const { data } = await uploadImage(file);
    setImageUrl(data.imageUrl);
  } catch (err) {
    setError(err.response?.data?.message || "Erreur lors de l'upload de l'image");
  } finally {
    setUploading(false);
  }
};

// Demande à l'IA (Groq) une liste d'étapes pertinentes pour l'objectif.
const handleSuggestSteps = async () => {
  if (!form.title.trim()) {
    setError('Renseigne d’abord le titre de l’objectif.');
    return;
  }
  setLoadingSuggestions(true);
  setError('');
  try {
    const categoryName = categories.find(c => c.id === form.categoryId)?.name || '';
    const res = await suggestSteps(form.title, form.description, categoryName);
    setSuggestedSteps(res.data.steps);
    setSelectedSteps(res.data.steps.map((_, i) => i));
  } catch (err) {
    setError(err.response?.data?.message || 'Erreur lors de la suggestion d’étapes.');
  } finally {
    setLoadingSuggestions(false);
  }
};

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-surface/90 px-7 shadow-soft backdrop-blur-md">
        <Link to="/" className="flex h-10 w-10 items-center justify-start text-primary">
          <span className="material-symbols-outlined text-3xl">close</span>
        </Link>
        <h1 className="text-xl font-bold text-primary">Nouvel Objectif</h1>
        <div className="w-6" />
      </header>

      <main className="mx-auto max-w-lg px-7 pt-28">
        <form id="goal-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
          {error && <p className="order-[6] rounded-xl bg-error-container px-4 py-3 text-sm font-medium text-error">{error}</p>}
          <div className="order-1">
            <label className="mb-3 block text-base font-semibold text-outline">Titre de l'objectif</label>
            <input
              placeholder="Ex: Courir un marathon"
              className="h-20 w-full rounded-2xl border-0 bg-surface-container-low px-5 text-lg font-medium text-on-surface outline-none ring-primary-container transition-shadow focus:ring-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="order-2">
            <label className="mb-3 block text-base font-semibold text-outline">Description</label>
            <textarea
              placeholder="Pourquoi cet objectif est-il important ?"
              rows={4}
              className="w-full resize-none rounded-2xl border-0 bg-surface-container-low p-5 text-base font-medium text-on-surface outline-none ring-primary-container transition-shadow focus:ring-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
<section className="order-4">
  <label className="mb-3 block text-base font-semibold text-outline">Image de couverture</label>
  {imageUrl ? (
    <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-container">
      <img src={imageUrl} alt="Aperçu de la couverture" className="h-full w-full object-cover" />
      <button type="button" onClick={() => { setImageUrl(''); setSelectedFileName(''); }} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-soft" aria-label="Supprimer l'image sélectionnée">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  ) : null}

  <div className="grid grid-cols-2 gap-4">
    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant text-outline transition-colors hover:border-primary-container hover:text-primary">
      <span className="material-symbols-outlined mb-3 text-4xl">add_a_photo</span>
      <span className="text-sm font-medium">{uploading ? 'Import en cours...' : 'Importer'}</span>
      {selectedFileName && <span className="mt-1 max-w-[80%] truncate text-xs">{selectedFileName}</span>}
      <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="sr-only" />
    </label>
    <button type="button" onClick={() => setShowUnsplashSearch((visible) => !visible)} className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${showUnsplashSearch ? 'border-primary-container bg-primary-container/5 text-primary' : 'border-outline-variant text-outline hover:border-primary-container hover:text-primary'}`}>
      <span className="material-symbols-outlined mb-3 text-4xl">search</span>
      <span className="text-sm font-medium">Recherche Unsplash</span>
    </button>
  </div>

  {showUnsplashSearch && (
    <div className="mt-4 rounded-2xl bg-surface-container-low p-4">
      <div className="flex gap-2">
        <input placeholder="Montagne, voyage, lecture..." className="h-14 min-w-0 flex-1 rounded-xl border-0 bg-white px-4 font-medium text-on-surface outline-none ring-primary-container focus:ring-2" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchImages())} autoFocus />
        <button type="button" onClick={searchImages} disabled={searchingImages} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-container text-white disabled:opacity-60" aria-label="Rechercher sur Unsplash">
          <span className={`material-symbols-outlined ${searchingImages ? 'animate-spin' : ''}`}>{searchingImages ? 'progress_activity' : 'search'}</span>
        </button>
      </div>
      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <button type="button" key={photo.id} onClick={() => { setImageUrl(photo.url); setSelectedFileName(''); setPhotos([]); setShowUnsplashSearch(false); }} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary-container">
              <img src={photo.thumb} alt={photo.alt || 'Résultat Unsplash'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-left text-[10px] font-medium text-white">{photo.credit}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )}
</section>

          <div className="order-3">
            <label className="mb-4 block text-base font-semibold text-outline">Catégorie</label>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className={`relative flex h-28 cursor-pointer items-center justify-center rounded-2xl border-2 transition-all ${
                    form.categoryId === c.id
                      ? 'border-primary-container bg-primary-container/5'
                      : 'border-transparent bg-surface-container-lowest hover:bg-surface-container'
                  } shadow-soft`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={c.id}
                    className="sr-only"
                    checked={form.categoryId === c.id}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-primary-container">
                      {iconMap[c.icon] || 'label'}
                    </span>
                    <span className="text-xs font-semibold text-on-surface">{c.name}</span>
                  </div>
                </label>
              ))}

              <label
                className={`relative flex h-28 cursor-pointer items-center justify-center rounded-2xl border-2 transition-all ${
                  form.categoryId === 'other'
                    ? 'border-primary-container bg-primary-container/5'
                    : 'border-transparent bg-surface-container-lowest hover:bg-surface-container'
                } shadow-soft`}
              >
                <input
                  type="radio"
                  name="category"
                  value="other"
                  className="sr-only"
                  checked={form.categoryId === 'other'}
                  onChange={() => setForm({ ...form, categoryId: 'other' })}
                />
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-primary-container">add</span>
                  <span className="text-xs font-semibold text-on-surface">Autre</span>
                </div>
              </label>
            </div>

            {form.categoryId === 'other' && (
              <div className="mt-3">
                <label className="block text-sm font-semibold text-outline mb-2">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  placeholder="Ex : Cuisine, Musique, Jardinage..."
                  className="input-field"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  required
                />
                <p className="text-xs text-outline mt-2">
                  Indique le thème qui correspond à cet objectif.
                </p>
              </div>
            )}
          </div>

          <div className="order-5">
            <label className="mb-3 block text-base font-semibold text-outline">Date d'échéance (optionnel)</label>
            <input
              type="date"
              className="h-20 w-full rounded-2xl border-0 bg-surface-container-low px-5 text-lg font-medium text-on-surface outline-none ring-primary-container focus:ring-2"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            />
          </div>
              <div className="order-7">
  <label className="mb-2 block text-base font-semibold text-outline">Étapes suggérées</label>
  <p className="text-xs text-outline mb-2">
    Groq peut te proposer des étapes basées sur ton objectif.
  </p>
  <button
    type="button"
    onClick={handleSuggestSteps}
    disabled={loadingSuggestions}
    className="mb-3 flex h-20 w-full items-center justify-center gap-2 rounded-full bg-surface-container text-lg font-bold text-primary-container shadow-soft transition-transform active:scale-[0.98] disabled:opacity-70"
  >
    <span className="material-symbols-outlined">auto_awesome</span>
    {loadingSuggestions ? 'Chargement...' : 'Suggérer des étapes'}
  </button>

  {suggestedSteps.length > 0 && (
    <div className="space-y-2">
      <p className="text-xs text-outline">Sélectionne les étapes à conserver :</p>
      {suggestedSteps.map((step, i) => (
        <label key={i} className="flex min-h-16 cursor-pointer items-center gap-4 rounded-xl bg-surface-container-lowest p-4">
          <input
            type="checkbox"
            checked={selectedSteps.includes(i)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedSteps([...selectedSteps, i]);
              } else {
                setSelectedSteps(selectedSteps.filter((idx) => idx !== i));
              }
            }}
            className="h-6 w-6 shrink-0 cursor-pointer accent-primary-container"
          />
          <span className="min-w-0 flex-1 text-sm leading-5 text-on-surface">{step.title}</span>
        </label>
      ))}
    </div>
  )}
</div>
          

          <button
            type="submit"
            disabled={loading}
            className="order-8 flex h-20 w-full items-center justify-center gap-2 rounded-full bg-primary-container text-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? 'Création...' : "Créer l'objectif"}
            <span className="material-symbols-outlined">auto_awesome</span>
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreateGoal;