// ForgotPassword.jsx : demande de réinitialisation du mot de passe.
// Envoie l'email au backend qui génère un token et envoie le lien par email.
// Le message de confirmation est volontairement identique que le compte existe
// ou non (anti-énumération des comptes).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError("L'adresse email n'est pas valide. Exemple : nom@domaine.fr");
      return;
    }
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la demande');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-background">
      <div className="w-full max-w-sm text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container mb-6 shadow-card">
          <span className="material-symbols-outlined text-white text-3xl">grid_view</span>
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Vision Board</h1>
        <p className="text-outline mt-2">Réinitialise ton mot de passe.</p>
      </div>

      <div className="w-full max-w-sm bg-surface-container-lowest p-6 rounded-xl shadow-card border border-surface-variant/30">
        {error && <p className="mb-4 rounded-xl bg-error-container p-3 text-sm font-medium text-error">{error}</p>}
        {sent ? (
          <p className="text-sm text-on-surface-variant">
            Si un compte est associé à cette adresse, un email de réinitialisation vient d'être envoyé.
            Vérifiez votre boîte de réception.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1 ml-1">Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={email.length > 0 && !emailPattern.test(email.trim())}
                required
              />
              {email.length > 0 && !emailPattern.test(email.trim()) && <p className="ml-1 mt-1 text-xs text-error">Saisis une adresse valide, par exemple nom@domaine.fr.</p>}
            </div>
            <button className="w-full h-14 bg-primary-container text-white font-semibold rounded-full shadow-lg shadow-primary-container/20 pill-button flex items-center justify-center gap-2">
              Envoyer le lien
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-sm text-outline">
        <Link to="/login" className="text-primary-container font-semibold">Retour à la connexion</Link>
      </p>
    </main>
  );
}

export default ForgotPassword;
