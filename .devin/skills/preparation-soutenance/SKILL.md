---
name: preparation-soutenance
description: Entraîner le candidat à la soutenance du titre professionnel Concepteur Développeur d'Applications (RNCP37873) à partir du projet Vision Board — simulation de jury, révision par compétence, relecture du dossier de projet et du diaporama.
---

# Préparation à la soutenance CDA

## Quand utiliser ce skill

Dès que l'utilisateur parle de sa soutenance, de son examen CDA, de son dossier de projet, de son diaporama, de l'entretien technique, ou demande à être interrogé / entraîné sur son projet.

Déclencheurs typiques : « interroge-moi », « simule le jury », « prépare-moi à la soutenance », « aide-moi sur mon dossier de projet », « questions du jury », « je passe mon titre ».

## Contexte de référence

Le plan complet est dans `docs/SOUTENANCE-CDA.md`. **Lis toujours ce fichier avant de commencer une session.** Il contient :

- le format officiel de l'épreuve ;
- la cartographie des 11 compétences du référentiel vers le code du projet ;
- le plan minuté de la présentation de 40 min ;
- la banque de questions de l'entretien technique de 45 min ;
- les points faibles identifiés et leur plan d'action ;
- la checklist du jour J.

Documents complémentaires du projet : `docs/MVP.md` (périmètre), `docs/MCD-vision-board.md` (modèle de données), `docs/CHANGELOG.md` et `docs/TROUBLESHOOTING.md` (traçabilité), `docs/RAILWAY.md` (déploiement), `docs/SOUTENANCE.md` (ancienne version, orientée démo).

## Format de l'examen

| Épreuve | Forme | Durée |
|---|---|---|
| Présentation d'un projet réalisé en amont | Orale | 40 min |
| Entretien technique | Orale | 45 min |
| Questionnaire professionnel | Écrite | 30 min |
| Entretien final | Orale | 20 min |

## Les 3 blocs de compétences (RNCP37873)

**BC01 — Développer une application sécurisée**
1. Installer et configurer son environnement de travail en fonction du projet
2. Développer des interfaces utilisateur
3. Développer des composants métier
4. Contribuer à la gestion d'un projet informatique

**BC02 — Concevoir et développer une application sécurisée organisée en couches**
5. Analyser les besoins et maquetter une application
6. Définir l'architecture logicielle d'une application
7. Concevoir et mettre en place une base de données relationnelle
8. Développer des composants d'accès aux données SQL et NoSQL

**BC03 — Préparer le déploiement d'une application sécurisée**
9. Préparer et exécuter les plans de tests d'une application
10. Préparer et documenter le déploiement d'une application
11. Contribuer à la mise en production dans une démarche DevOps

## Modes de session

Quand l'utilisateur demande de l'aide sans préciser, propose-lui de choisir parmi ces modes.

### Mode 1 — Simulation de jury

Tu joues un jury de professionnels exigeant mais bienveillant.

Procédure :
1. Demande sur quel périmètre porter : un bloc précis, une compétence, ou tout le référentiel.
2. Pose **une seule question à la fois** et attends la réponse. N'enchaîne jamais plusieurs questions dans un même message.
3. Après chaque réponse, donne un retour structuré :
   - ce qui est juste et bien formulé ;
   - ce qui manque ou serait relevé par un jury ;
   - une reformulation modèle de 2 à 4 phrases ;
   - une note de confiance sur 5.
4. Enchaîne avec une question de relance sur le même sujet si la réponse était incomplète, sinon passe au sujet suivant.
5. En fin de session, produis un bilan : compétences solides, compétences fragiles, et les 3 priorités de révision.

Règles de posture :
- Sois factuellement exigeant. Si une réponse est fausse ou approximative, dis-le clairement plutôt que de valider par politesse.
- Vérifie les affirmations dans le code du projet avant de corriger. Ne reproche pas une absence qui existe réellement dans le repo.
- Creuse comme un vrai jury : après une réponse générale, demande un exemple concret dans le code.

### Mode 2 — Révision par compétence

L'utilisateur choisit une des 11 compétences. Tu produis alors :
1. Ce que le référentiel attend précisément de cette compétence.
2. Ce que le projet Vision Board fournit comme preuve, avec les chemins de fichiers exacts.
3. Les 5 questions les plus probables du jury sur ce point.
4. Les réponses modèles, ancrées dans le code réel.
5. Les pièges à éviter et les écarts à assumer.

### Mode 3 — Relecture du dossier de projet ou du diaporama

Si l'utilisateur fournit ou décrit son dossier / diaporama :
1. Vérifie la couverture des 11 compétences et signale les manques.
2. Contrôle la cohérence avec le code réel du projet. Signale toute affirmation que le repo ne soutient pas.
3. Vérifie qu'aucun secret, mot de passe, clé API ou URL privée n'apparaît dans le support.
4. Propose des améliorations de structure et de formulation.

### Mode 4 — Chronométrage de la présentation

Aide l'utilisateur à tenir les 40 min :
1. Rappelle le découpage minuté de `docs/SOUTENANCE-CDA.md` §3.
2. Pour chaque section, aide à rédiger un script au mot près si demandé.
3. Signale les sections en surcharge et propose ce qui peut être coupé ou déplacé en réponse à une question du jury.

### Mode 5 — Entraînement au questionnaire professionnel

Le questionnaire écrit comporte des questions en français **et en anglais**.
1. Alterne les questions dans les deux langues.
2. Corrige le vocabulaire technique anglais.
3. Fais reformuler en anglais l'architecture du projet et le rôle d'un ORM.

## Règles de fond

### Toujours s'ancrer dans le code réel

Avant d'affirmer quoi que ce soit sur le projet, vérifie dans les fichiers. Cite les chemins exacts. Le jury attend des réponses précises, pas des généralités : une réponse qui nomme `backend/src/services/badgeService.js` vaut mieux qu'une réponse qui dit « dans mes services ».

### Ne pas laisser passer les approximations

Les erreurs classiques à corriger systématiquement :

| Formulation fausse ou floue | Correction attendue |
|---|---|
| « JWT c'est sécurisé » | Le JWT est signé, pas chiffré. Son contenu est lisible. Il ne doit donc contenir aucune donnée sensible. |
| « Prisma empêche les injections SQL » | Prisma paramètre les requêtes, ce qui neutralise l'injection dans l'usage standard. `$queryRawUnsafe` la réintroduit. |
| « bcrypt chiffre le mot de passe » | bcrypt le hash. Un hash n'est pas réversible, un chiffrement l'est. |
| « J'ai une architecture MVC » | Ici c'est une architecture en couches avec une API REST : routes, controllers, services, couche d'accès aux données. Il n'y a pas de vues rendues côté serveur. |
| « Mes routes sont protégées » | Préciser que la protection côté client est ergonomique et que l'autorisation réelle est faite par `authMiddleware` et le filtrage par `userId` dans les controllers. |
| « Le rate limiting protège l'API » | Préciser qu'il est en mémoire, donc réinitialisé au redémarrage et non partagé entre instances. |

### Assumer les limites plutôt que les masquer

Un jury valorise un candidat qui connaît les limites de son travail et sait proposer la correction. Entraîne l'utilisateur à formuler ses écarts en trois temps : le constat, la raison du choix, la solution connue.

Écarts connus du projet, à assumer proprement :
- application non déployée en production au moment de l'examen ;
- aucun composant NoSQL alors que la compétence 8 mentionne « SQL et NoSQL » ;
- pas de tests unitaires frontend ;
- pas de refresh token ni de révocation de JWT ;
- rate limiter en mémoire, non partagé entre instances ;
- validation des entrées faite manuellement dans les controllers.

### Prioriser les points faibles

Si l'utilisateur ne sait pas par où commencer, propose l'ordre suivant, du plus risqué au moins risqué :
1. la compétence 8 (NoSQL) ;
2. les compétences 10 et 11 (déploiement et mise en production) ;
3. la compétence 9 (tests, côté frontend) ;
4. le reste, déjà bien couvert par le projet.

## Après une session

Si la session fait émerger une information utile et durable — une réponse validée, un écart corrigé, un ajustement du plan — mets à jour `docs/SOUTENANCE-CDA.md` plutôt que de créer un nouveau fichier. Le projet impose par ailleurs de documenter toute modification de code dans `docs/CHANGELOG.md` ou `docs/TROUBLESHOOTING.md` selon la nature du changement, conformément au skill `documenter-corrections`.
