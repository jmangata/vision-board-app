// Privacy.jsx : politique de confidentialité (RGPD).
// Page publique décrivant les données collectées, leur finalité, les droits
// de l'utilisateur et la procédure de suppression de compte.
function Privacy() {
  return (
    <main className="min-h-screen px-5 py-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-6">Politique de confidentialité</h1>

        <section className="card p-6 space-y-3 mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Données collectées</h2>
          <p className="text-sm text-on-surface-variant">
            Vision Board collecte uniquement les données nécessaires au fonctionnement du service :
            adresse email, prénom, mot de passe (stocké sous forme de hash bcrypt), ainsi que les
            objectifs, étapes, rappels et badges que vous créez.
          </p>
        </section>

        <section className="card p-6 space-y-3 mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Finalité</h2>
          <p className="text-sm text-on-surface-variant">
            Ces données servent exclusivement à fournir le service de suivi d'objectifs :
            authentification, affichage de votre tableau de vision, statistiques de progression,
            attribution de badges et envoi de rappels par email. Aucune donnée n'est vendue ni
            partagée à des tiers à des fins commerciales.
          </p>
        </section>

        <section className="card p-6 space-y-3 mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Vos droits (RGPD)</h2>
          <ul className="text-sm text-on-surface-variant list-disc pl-5 space-y-1">
            <li><strong>Accès</strong> : vos données sont consultables dans votre profil.</li>
            <li><strong>Rectification</strong> : modifiables depuis la page Profil.</li>
            <li><strong>Effacement</strong> : le bouton « Supprimer mon compte » dans Profil efface
              définitivement votre compte et toutes vos données (objectifs, étapes, rappels, badges).</li>
          </ul>
        </section>

        <section className="card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-on-surface">Sécurité</h2>
          <p className="text-sm text-on-surface-variant">
            Mots de passe hachés avec bcrypt, authentification par token JWT, en-têtes HTTP
            sécurisés et limitation du nombre de requêtes sur l'API.
          </p>
        </section>
      </div>
    </main>
  );
}

export default Privacy;
