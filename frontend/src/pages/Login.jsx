import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService.js';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login(form);
      localStorage.setItem('token', data.token);
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-background">
      <div className="w-full max-w-sm text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container mb-6 shadow-card">
          <span className="material-symbols-outlined text-white text-3xl">grid_view</span>
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Vision Board</h1>
        <p className="text-outline mt-2">Visualise ton avancée, atteins tes rêves.</p>
      </div>

      <div className="w-full max-w-sm bg-surface-container-lowest p-6 rounded-xl shadow-card border border-surface-variant/30">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1 ml-1">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input
                type="email"
                placeholder="name@example.com"
                className="input-field pl-12"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center px-1 mb-1">
              <label className="text-sm font-semibold text-on-surface-variant">Mot de passe</label>
              <a href="#" className="text-sm text-primary-container">Oublié ?</a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field pl-12"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          <button className="w-full h-14 bg-primary-container text-white font-semibold rounded-full shadow-lg shadow-primary-container/20 pill-button flex items-center justify-center gap-2">
            Connexion
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="relative flex items-center justify-center mb-4">
            <div className="flex-grow border-t border-surface-variant"></div>
            <span className="px-3 text-xs font-medium text-outline-variant bg-surface-container-lowest">OU CONTINUER AVEC</span>
            <div className="flex-grow border-t border-surface-variant"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="h-12 border border-outline-variant rounded-full flex items-center justify-center gap-2 text-sm font-medium text-on-surface hover:bg-surface-container-low">
              Google
            </button>
            <button className="h-12 border border-outline-variant rounded-full flex items-center justify-center gap-2 text-sm font-medium text-on-surface hover:bg-surface-container-low">
              Apple
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-outline">
        Pas de compte ?{' '}
        <Link to="/register" className="text-primary-container font-semibold">Inscription</Link>
      </p>
    </main>
  );
}

export default Login;