import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';

function CreateGoal() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', targetDate: '', categoryId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data);
      if (res.data.length) setForm((f) => ({ ...f, categoryId: res.data[0].id }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
      };
      await api.post('/goals', payload);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création de l'objectif");
    } finally {
      setLoading(false);
    }
  };

  const iconMap = {
    book: 'menu_book',
    briefcase: 'work',
    'dollar-sign': 'payments',
    users: 'groups',
    heart: 'favorite',
    map: 'flight',
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md h-16 flex justify-between items-center px-5 shadow-soft">
        <Link to="/" className="text-primary">
          <span className="material-symbols-outlined">close</span>
        </Link>
        <h1 className="text-lg font-semibold text-primary">Nouvel Objectif</h1>
        <div className="w-6" />
      </header>

      <main className="pt-24 px-5 max-w-lg mx-auto">
        <form id="goal-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && <p className="text-error text-sm font-medium">{error}</p>}
          <div>
            <label className="block text-sm font-semibold text-outline mb-2">Titre de l'objectif</label>
            <input
              placeholder="Ex: Courir un marathon"
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-outline mb-2">Description</label>
            <textarea
              placeholder="Pourquoi cet objectif est-il important ?"
              rows={3}
              className="w-full bg-surface-container-low rounded-xl p-4 font-medium text-on-surface border-none focus:ring-2 focus:ring-primary-container transition-all resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-outline mb-2">Catégorie</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className={`relative flex items-center justify-center h-20 rounded-xl cursor-pointer border-2 transition-all ${
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
                  <div className="flex flex-col items-center gap-1">
                    <span className="material-symbols-outlined text-primary-container">
                      {iconMap[c.icon] || 'label'}
                    </span>
                    <span className="text-xs font-semibold text-on-surface">{c.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-outline mb-2">Date d'échéance (optionnel)</label>
            <input
              type="date"
              className="input-field"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary-container text-white font-semibold rounded-full shadow-lg pill-button flex items-center justify-center gap-2 disabled:opacity-70"
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