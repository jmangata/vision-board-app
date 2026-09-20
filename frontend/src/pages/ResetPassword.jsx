// ResetPassword.jsx : définition d'un nouveau mot de passe via le lien reçu par email.
// Le token est lu dans l'URL (?token=...) puis envoyé au backend avec le nouveau
// mot de passe. Le formulaire reprend le même système de validation que
// l'inscription : règles affichées en direct + contrôle de correspondance
// entre les deux champs.
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const passwordRules = [
  { label: '12 caractères minimum', valid: (value) => value.length >= 12 },
  { label: 'Une lettre', valid: (value) => /[A-Za-z]/.test(value) },
  { label: 'Un chiffre', valid: (value) => /\d/.test(value) },
  { label: 'Un caractère spécial', valid: (value) => /[^A-Za-z\d\s]/.test(value) },
];

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Les deux champs doivent être strictement identiques pour valider le formulaire.
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordRules.every((rule) => rule.valid(password))) {
      setError('Le mot de passe ne respecte pas encore toutes les règles indiquées.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-background">
      <div className="w-full max-w-sm text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container mb-6 shadow-card">
          <span className="material-symbols-outlined text-white text-3xl">lock_reset</span>
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Nouveau mot de passe</h1>
        <p className="text-outline mt-2">Choisis un mot de passe sécurisé.</p>
      </div>

      <div className="w-full max-w-sm bg-surface-container-lowest p-6 rounded-xl shadow-card border border-surface-variant/30">
        {!token ? (
          <p className="text-sm text-error">Lien de réinitialisation invalide : aucun token fourni.</p>
        ) : (
          <>
            {error && <p className="mb-4 rounded-xl bg-error-container p-3 text-sm font-medium text-error">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1 ml-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <ul className="mt-2 space-y-1 px-1">
                  {passwordRules.map((rule) => {
                    const valid = rule.valid(password);
                    return <li key={rule.label} className={`text-xs ${valid ? 'font-semibold text-secondary' : 'text-outline'}`}>{valid ? '✓' : '○'} {rule.label}</li>;
                  })}
                </ul>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1 ml-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={mismatch}
                  required
                />
                {mismatch && <p className="ml-1 mt-1 text-xs text-error">Les mots de passe ne correspondent pas.</p>}
              </div>

              <button className="w-full h-14 bg-primary-container text-white font-semibold rounded-full shadow-lg shadow-primary-container/20 pill-button flex items-center justify-center gap-2">
                Réinitialiser
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-sm text-outline">
        <Link to="/login" className="text-primary-container font-semibold">Retour à la connexion</Link>
      </p>
    </main>
  );
}

export default ResetPassword;
