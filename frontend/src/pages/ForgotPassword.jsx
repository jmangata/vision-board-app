// ForgotPassword.jsx : demande de réinitialisation du mot de passe.
// Envoie l'email au backend qui génère un token et envoie le lien par email.
// Le message de confirmation est volontairement identique que le compte existe
// ou non (anti-énumération des comptes).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <div className="w-full max-w-sm bg-surface-container-lowest p-6 rounded-xl shadow-card border border-surface-variant/30">
        <h1 className="text-2xl font-bold text-primary mb-2">Mot de passe oublié</h1>
        {sent ? (
          <p className="text-sm text-on-surface-variant">
            Si un compte est associé à cette adresse, un email de réinitialisation vient d'être envoyé.
            Vérifiez votre boîte de réception.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {error && <p className="text-error text-sm font-medium">{error}</p>}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1 ml-1">Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="w-full h-14 bg-primary-container text-white font-semibold rounded-full shadow-lg shadow-primary-container/20 pill-button">
              Envoyer le lien
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

export default ForgotPassword;
