import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService.js';

function Register() {
  const [form, setForm] = useState({ email: '', password: '', firstname: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await register(form);
      localStorage.setItem('token', data.token);
      navigate('/');
      window.location.reload();
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
              required
            />
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