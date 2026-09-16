// Register.jsx : page d'inscription.
// Elle crée un nouveau compte via l'API, stocke le JWT reçu et redirige vers l'accueil.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { prepareWelcome, register } from '../services/authService.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRules = [
  { label: '12 caractères minimum', valid: (value) => value.length >= 12 },
  { label: 'Une lettre', valid: (value) => /[A-Za-z]/.test(value) },
  { label: 'Un chiffre', valid: (value) => /\d/.test(value) },
  { label: 'Un caractère spécial', valid: (value) => /[^A-Za-z\d\s]/.test(value) },
];

function Register() {
  const [form, setForm] = useState({ email: '', password: '', firstname: '' });
  const [error, setError] = useState('');
  // Enregistre l'utilisateur, persiste le token et recharge la session.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailPattern.test(form.email.trim())) {
      setError("L'adresse email n'est pas valide. Exemple : nom@domaine.fr");
      return;
    }
    if (!passwordRules.every((rule) => rule.valid(form.password))) {
      setError('Le mot de passe ne respecte pas encore toutes les règles indiquées.');
      return;
    }
    setError('');
    try {
      const { data } = await register(form);
      localStorage.setItem('token', data.token);
      prepareWelcome(data.user.firstname);
      window.location.replace('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur d\'inscription');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-background">
      <div className="w-full max-w-sm text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container mb-6 shadow-card">
          <span className="material-symbols-outlined text-white text-3xl">grid_view</span>
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Vision Board</h1>
        <p className="text-outline mt-2">Crée ton compte et commence ton voyage.</p>
      </div>

      <div className="w-full max-w-sm bg-surface-container-lowest p-6 rounded-xl shadow-card border border-surface-variant/30">
        {error && <p className="mb-4 rounded-xl bg-error-container p-3 text-sm font-medium text-error">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1 ml-1">Prénom</label>
            <input
              placeholder="Ton prénom"
              className="input-field"
              value={form.firstname}
              onChange={(e) => setForm({ ...form, firstname: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1 ml-1">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={form.email.length > 0 && !emailPattern.test(form.email.trim())}
              required
            />
            {form.email.length > 0 && !emailPattern.test(form.email.trim()) && <p className="ml-1 mt-1 text-xs text-error">Saisis une adresse valide, par exemple nom@domaine.fr.</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1 ml-1">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <ul className="mt-2 space-y-1 px-1">
              {passwordRules.map((rule) => {
                const valid = rule.valid(form.password);
                return <li key={rule.label} className={`text-xs ${valid ? 'font-semibold text-secondary' : 'text-outline'}`}>{valid ? '✓' : '○'} {rule.label}</li>;
              })}
            </ul>
          </div>

          <button className="w-full h-14 bg-primary-container text-white font-semibold rounded-full shadow-lg shadow-primary-container/20 pill-button flex items-center justify-center gap-2">
            Inscription
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-outline">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-primary-container font-semibold">Connexion</Link>
      </p>
    </main>
  );
}

export default Register;