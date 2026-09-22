# Règles du projet Vision Board App

## Règle critique : documenter chaque correction et modification

Chaque fois qu'un bug est corrigé, qu'une fonctionnalité est modifiée, qu'un endpoint est ajouté ou que la configuration du projet évolue, tu **dois** rédiger une documentation qui décrit :

- l'erreur ou le comportement incorrect constaté ;
- la cause racine du problème ;
- la solution mise en œuvre ;
- les fichiers concernés ;
- la méthode de vérification.

### Où écrire

- Problèmes techniques, erreurs de build/runtime, environnement : `docs/TROUBLESHOOTING.md`
- Évolutions fonctionnelles, changements de comportement, nouvelles fonctionnalités : `docs/CHANGELOG.md`

### Format attendu

```markdown
## Titre court

### Contexte
...

### Erreur constatée
...

### Cause
...

### Solution
- Fichiers modifiés : `backend/src/...`, `frontend/src/...`
- Description des changements...

### Vérification
...

### Points de vigilance
...
```

### Compétence associée

Voir `.devin/skills/documenter-corrections/SKILL.md` pour les instructions détaillées.

---

## Préparation à la soutenance CDA

Ce projet sert de support à l'examen du titre professionnel **Concepteur Développeur d'Applications** (RNCP37873).

Dès que la conversation porte sur la soutenance, le dossier de projet, le diaporama, l'entretien technique ou une simulation de jury, invoque le skill `preparation-soutenance`.

- Plan de référence : `docs/SOUTENANCE-CDA.md`
- Instructions détaillées : `.devin/skills/preparation-soutenance/SKILL.md`

Deux règles de fond s'appliquent à ces échanges :

1. **S'ancrer dans le code réel.** Toute affirmation sur le projet doit être vérifiée dans les fichiers et citée avec son chemin exact.
2. **Ne pas valider les approximations.** Une réponse fausse ou floue doit être corrigée explicitement, y compris sur les écarts assumés du projet (pas de NoSQL, pas de tests frontend, pas de refresh token, rate limiter en mémoire).
