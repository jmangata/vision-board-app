# Documenter chaque correction ou modification significative

## Quand utiliser ce skill

À chaque fois que tu corriges un bug, que tu modifies une fonctionnalité existante, que tu ajoutes un endpoint, que tu changes une règle métier ou que tu touches à la configuration du projet (env, dépendances, build, Docker, etc.).

Cette règle s'applique aussi bien au backend, au frontend web, à l'application mobile, aux scripts d'administration et à la configuration DevOps.

## Procédure obligatoire

Après chaque correction ou modification significative, rédige une entrée de documentation qui décrit :

1. **Contexte** : où et comment le problème a été observé (page, endpoint, commande, environnement).
2. **Erreur / comportement attendu** : message d'erreur exact, code HTTP, stack trace réduit, ou comportement incorrect constaté. Indique également le comportement attendu.
3. **Cause racine** : pourquoi le problème se produisait (mauvaise route, type incohérent, manque de validation, fuite de données, mauvaise config, dépendance dépréciée, etc.).
4. **Solution apportée** : quels fichiers ont été modifiés et pourquoi. Décris les changements de manière concise mais suffisante pour qu'un autre développeur puisse comprendre sans relire tout le diff.
5. **Vérification** : comment s'assurer que le correctif fonctionne (commande de test, appel API, scénario manuel).
6. **Pièges / points de vigilance** : effets de bord possibles, données à réinitialiser, variables d'environnement à vérifier, etc.

## Où écrire la documentation

- Si le problème est un bug technique, une erreur de build, une erreur d'exécution ou un problème d'environnement : ajoute une section dans `docs/TROUBLESHOOTING.md`.
- Si le problème est une évolution fonctionnelle, un changement de comportement ou une nouvelle fonctionnalité : ajoute une entrée dans `docs/CHANGELOG.md`.
- Si la modification est mineure et purement interne (refactoring sans impact utilisateur) : un commentaire de commit explicite peut suffire, mais privilégie quand même un ajout dans `docs/CHANGELOG.md` si elle corrige un dysfonctionnement.

## Format attendu

```markdown
## Titre court et explicite

### Contexte
...

### Erreur constatée
...

### Cause
...

### Solution
- Fichiers modifiés : `backend/src/controllers/xxx.js`, `frontend/src/pages/xxx.jsx`
- Description des changements...

### Vérification
...

### Points de vigilance
...
```

## Règles de style

- Sois factuel : ne pas inventer de cause si tu n'es pas sûr ; indique « cause non identifiée avec certitude » le cas échéant.
- Cite les fichiers concernés avec leur chemin relatif à la racine du projet.
- Inclus les messages d'erreur exacts entre backticks.
- Ne pas supprimer les entrées existantes : ajoute en dessous.
- Si un même bug est corrigé à plusieurs endroits, crée une seule entrée regroupant tous les fichiers.

## Conséquence si cette règle n'est pas suivie

Sans cette documentation, les régressions deviennent difficiles à diagnostiquer et les connaissances restent non partagées. Chaque correction doit donc être accompagnée de sa trace écrite.
