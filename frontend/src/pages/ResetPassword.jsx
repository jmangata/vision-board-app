// ResetPassword.jsx : définition d'un nouveau mot de passe via le lien reçu par email.
// Le token est lu dans l'URL (?token=...) puis envoyé au backend avec le nouveau
// mot de passe. Le token est à usage unique et expire après 1 heure.
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-background">
      <div className="w-full max-w-sm bg-surface-container-lowest p-6 rounded-xl shadow-card border border-surface-variant/30">
        <h1 className="text-2xl font-bold text-primary mb-2">Nouveau mot de passe</h1>
        {!token ? (
          <p className="text-sm text-error">Lien de réinitialisation invalide : aucun token fourni.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {error && <p className="text-error text-sm font-medium">{error}</p>}
            <p className="text-xs text-outline">
              12 caractères minimum, avec une lettre, un chiffre et un caractère spécial.
            </p>
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              className="input-field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button className="w-full h-14 bg-primary-container text-white font-semibold rounded-full shadow-lg shadow-primary-container/20 pill-button">
              Réinitialiser
            </button>
          </form>
        )}
        <p className="mt-6 text-sm text-outline text-center">
          <Link to="/login" className="text-primary-container font-semibold">Retour à la connexion</Link>
        </p>
      </div>
    </main>
  );
}

export default ResetPassword;
