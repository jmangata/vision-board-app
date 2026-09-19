// Profile.jsx : page de profil utilisateur.
// Affiche les informations du compte connecté et permet de modifier son prénom, email et mot de passe.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstname: '', email: '', currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirige vers la connexion si aucun token n'est présent, sinon charge le profil.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    api.get('/users/me').then((res) => {
      setUser(res.data);
      setForm((f) => ({ ...f, firstname: res.data.firstname, email: res.data.email }));
    });
  }, [navigate]);

  // Envoie les modifications du profil, mot de passe inclus uniquement s'il est renseigné.
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload = { firstname: form.firstname, email: form.email };
      // Inclut les champs de mot de passe seulement si un nouveau mot de passe est demandé.
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const { data } = await api.put('/users/me', payload);
      setUser((u) => ({ ...u, ...data }));
      setEditing(false);
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
      setMessage('Profil mis à jour');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  // Déconnecte l'utilisateur en supprimant le token et en rechargeant l'application.
  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  // Supprime définitivement le compte (droit à l'oubli RGPD) après confirmation
  // et vérification du mot de passe côté serveur, puis déconnecte.
  const deleteAccount = async () => {
    const password = window.prompt('Entrez votre mot de passe pour confirmer la suppression définitive du compte :');
    if (!password) return;
    try {
      await api.delete('/users/me', { data: { password } });
      logout();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du compte');
    }
  };

  if (!user) return <p className="p-5">Chargement...</p>;

  // Formate la date d'inscription en français pour l'affichage.
  const memberSince = new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="px-5 pt-6 pb-28">
      <h1 className="text-2xl font-bold text-primary mb-6">Mon Profil</h1>

      <div className="card p-6 flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mb-4 shadow-card">
          <span className="text-3xl font-bold text-white">{user.firstname.charAt(0).toUpperCase()}</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">{user.firstname}</h2>
        <p className="text-sm text-outline">{user.email}</p>
        <p className="text-xs text-outline-variant mt-1">Membre depuis le {memberSince}</p>
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{user._count.goals}</p>
            <p className="text-xs text-outline">Objectifs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{user._count.badges}</p>
            <p className="text-xs text-outline">Badges</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-secondary-container/20 text-secondary p-3 rounded-xl text-sm font-medium mb-4">
          {message}
        </div>
      )}

      {error && !editing && (
        <div className="bg-error-container/20 text-error p-3 rounded-xl text-sm font-medium mb-4">
          {error}
        </div>
      )}

      {!editing ? (
        <div className="space-y-3">
          <button onClick={() => setEditing(true)} className="w-full card p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
            <span className="material-symbols-outlined text-primary-container">edit</span>
            <span className="font-medium text-on-surface">Modifier le profil</span>
            <span className="material-symbols-outlined ml-auto text-outline">chevron_right</span>
          </button>
          <button onClick={logout} className="w-full card p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
            <span className="material-symbols-outlined text-error">logout</span>
            <span className="font-medium text-error">Déconnexion</span>
            <span className="material-symbols-outlined ml-auto text-outline">chevron_right</span>
          </button>
          <button onClick={deleteAccount} className="w-full card p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
            <span className="material-symbols-outlined text-error">delete_forever</span>
            <span className="font-medium text-error">Supprimer mon compte</span>
            <span className="material-symbols-outlined ml-auto text-outline">chevron_right</span>
          </button>
          <button onClick={() => navigate('/privacy')} className="w-full card p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
            <span className="material-symbols-outlined text-outline">privacy_tip</span>
            <span className="font-medium text-on-surface">Politique de confidentialité</span>
            <span className="material-symbols-outlined ml-auto text-outline">chevron_right</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="card p-6 space-y-4">
          {error && <p className="text-error text-sm font-medium">{error}</p>}
          <div>
            <label className="block text-sm font-semibold text-outline mb-2">Prénom</label>
            <input className="input-field" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-outline mb-2">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="border-t border-surface-variant/30 pt-4">
            <p className="text-sm font-semibold text-outline mb-3">Changer le mot de passe (optionnel)</p>
             <p className="text-xs text-outline mb-3">
    Remplis ces champs uniquement si tu souhaites modifier ton mot de passe actuel.
  </p>
            <div className="space-y-3">
              <input type="password" placeholder="Mot de passe actuel" className="input-field" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
              <input type="password" placeholder="Nouveau mot de passe" className="input-field" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setEditing(false); setError(''); }} className="flex-1 h-12 border border-outline-variant rounded-full font-semibold text-on-surface pill-button">Annuler</button>
            <button type="submit" className="flex-1 h-12 bg-primary-container text-white rounded-full font-semibold pill-button">Enregistrer</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;