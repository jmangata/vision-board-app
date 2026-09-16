import { useEffect, useState } from 'react';
import { getSlideshow, saveSlideshow } from '../services/slideshowService.js';

const emptySlide = () => ({ title: '', content: '', imageUrl: '', duration: 5 });

function Slideshow() {
  const [presentation, setPresentation] = useState({ title: '', description: '', slides: [emptySlide()] });
  const [activeIndex, setActiveIndex] = useState(0);
  const [editing, setEditing] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getSlideshow()
      .then(({ data }) => setPresentation({
        title: data.title || '',
        description: data.description || '',
        slides: data.slides?.length ? data.slides : [emptySlide()],
      }))
      .catch(() => setError('Impossible de charger la présentation.'));
  }, []);

  const updatePresentation = (field, value) => {
    setPresentation((current) => ({ ...current, [field]: value }));
  };

  const updateSlide = (index, field, value) => {
    setPresentation((current) => ({
      ...current,
      slides: current.slides.map((slide, slideIndex) => (
        slideIndex === index ? { ...slide, [field]: field === 'duration' ? Number(value) : value } : slide
      )),
    }));
  };

  const addSlide = () => {
    setPresentation((current) => ({ ...current, slides: [...current.slides, emptySlide()] }));
    setActiveIndex(presentation.slides.length);
  };

  const removeSlide = (index) => {
    if (presentation.slides.length === 1) return;
    setPresentation((current) => ({ ...current, slides: current.slides.filter((_, slideIndex) => slideIndex !== index) }));
    setActiveIndex((current) => Math.max(0, Math.min(current, presentation.slides.length - 2)));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await saveSlideshow(presentation);
      setPresentation(data);
      setMessage('Présentation enregistrée.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l’enregistrement.');
    }
  };

  const activeSlide = presentation.slides[activeIndex] || presentation.slides[0];

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Ma présentation</h1>
          <p className="mt-1 text-sm text-outline">Saisis les données de ton projet et présente-les écran par écran.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(true)} className={`rounded-full px-4 py-2 text-sm font-semibold ${editing ? 'bg-primary-container text-white' : 'bg-surface-container text-primary'}`}>Éditer</button>
          <button type="button" onClick={() => setEditing(false)} className={`rounded-full px-4 py-2 text-sm font-semibold ${!editing ? 'bg-primary-container text-white' : 'bg-surface-container text-primary'}`}>Présenter</button>
        </div>
      </div>

      {message && <p className="mb-4 rounded-xl bg-secondary-container/20 p-3 text-sm font-medium text-secondary">{message}</p>}
      {error && <p className="mb-4 rounded-xl bg-error-container/20 p-3 text-sm font-medium text-error">{error}</p>}

      {editing ? (
        <form onSubmit={handleSave} className="space-y-5">
          <section className="card space-y-4 p-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-outline">Titre de la présentation</label>
              <input className="input-field" value={presentation.title} onChange={(event) => updatePresentation('title', event.target.value)} placeholder="Ex. Présentation de Vision Board" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-outline">Introduction</label>
              <textarea className="input-field min-h-24" value={presentation.description} onChange={(event) => updatePresentation('description', event.target.value)} placeholder="Résume ton projet en quelques lignes." />
            </div>
          </section>

          <section className="space-y-4">
            {presentation.slides.map((slide, index) => (
              <article key={`${index}-${slide.id || 'new'}`} className="card space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-primary">Diapositive {index + 1}</h2>
                  <button type="button" onClick={() => removeSlide(index)} className="text-sm font-semibold text-error" disabled={presentation.slides.length === 1}>Supprimer</button>
                </div>
                <input className="input-field" value={slide.title} onChange={(event) => updateSlide(index, 'title', event.target.value)} placeholder="Titre de la diapositive" required />
                <textarea className="input-field min-h-28" value={slide.content || ''} onChange={(event) => updateSlide(index, 'content', event.target.value)} placeholder="Contenu, chiffres, explications..." />
                <input className="input-field" value={slide.imageUrl || ''} onChange={(event) => updateSlide(index, 'imageUrl', event.target.value)} placeholder="URL d'une image (optionnel)" />
                <label className="flex items-center gap-3 text-sm text-outline">
                  Durée
                  <input className="w-20 rounded-xl border border-outline-variant bg-white px-3 py-2 text-center" type="number" min="3" max="60" value={slide.duration || 5} onChange={(event) => updateSlide(index, 'duration', event.target.value)} />
                  secondes
                </label>
              </article>
            ))}
            <button type="button" onClick={addSlide} className="w-full rounded-xl border border-dashed border-primary-container p-4 font-semibold text-primary-container">+ Ajouter une diapositive</button>
          </section>

          <button type="submit" className="h-14 w-full rounded-full bg-primary-container font-semibold text-white shadow-lg">Enregistrer la présentation</button>
        </form>
      ) : (
        <section className="card overflow-hidden">
          <div className="relative min-h-[28rem] bg-primary p-6 text-white md:p-12">
            {activeSlide?.imageUrl && <img src={activeSlide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
            <div className="relative flex min-h-[24rem] flex-col justify-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{presentation.title}</p>
              <h2 className="max-w-3xl text-3xl font-bold md:text-5xl">{activeSlide?.title}</h2>
              <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-7 text-white/85 md:text-xl">{activeSlide?.content}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <button type="button" onClick={() => setActiveIndex((current) => Math.max(0, current - 1))} className="rounded-full bg-surface-container px-4 py-2 font-semibold text-primary" disabled={activeIndex === 0}>Précédente</button>
            <span className="text-sm text-outline">{activeIndex + 1} / {presentation.slides.length}</span>
            <button type="button" onClick={() => setActiveIndex((current) => Math.min(presentation.slides.length - 1, current + 1))} className="rounded-full bg-primary-container px-4 py-2 font-semibold text-white" disabled={activeIndex === presentation.slides.length - 1}>Suivante</button>
          </div>
        </section>
      )}
    </div>
  );
}

export default Slideshow;
