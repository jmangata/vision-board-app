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
