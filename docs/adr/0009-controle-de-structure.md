# ADR 0009 : contrôle automatique des limites de structure

Statut : accepté le 2026-10-19. Décisions de portée prises le 2026-10-19.

## Contexte

Le standard du projet est le suivant :
- au plus 5 fonctions par fichier ;
- au plus 5 fichiers par dossier ;
- au plus 3 niveaux de sous-dossiers.

Un dépassement doit faire échouer la CI (N1).

## Décisions de portée

- Le contrôle porte sur les fichiers suivis par git, donc ni `node_modules` ni les fichiers générés.
- `docs/` est exclu : le standard vise le code, et les ADR forment un journal qui ne fait que grossir.
- Seuls les fichiers comptent dans la limite de 5 par dossier ; les sous-dossiers, non.
- Racine : une liste nominative de fichiers de configuration imposés par les outils est exemptée. Tout autre fichier à la racine compte dans la limite de 5. Liste proposée :
  - `package.json`, `package-lock.json` ;
  - `tsconfig.json`, `next.config.ts`, `next-env.d.ts` ;
  - `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts` ;
  - `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json` ;
  - `README.md`, `LICENSE`, `CLAUDE.md`, `.gitignore`, `.env.example`.
- Pour ajouter une exception, il faut amender cet ADR. Chaque exception est commentée dans le script.

## Règles

- **Profondeur** : un fichier peut se trouver à 3 dossiers sous la racine au plus. `a/b/c/f.ts` passe, `a/b/c/d/f.ts` échoue.
- **Fonctions** : le contrôle porte sur les fichiers `.ts`, `.tsx`, `.js` et `.mjs` (décision Q5).
  - Comptent : les déclarations de fonction, les méthodes de classe ou d'objet, les accesseurs, et les fonctions fléchées ou expressions de fonction assignées à une variable, une propriété ou un export.
  - Ne comptent pas : les fonctions anonymes passées directement en argument (callbacks de test, `map`, gestionnaires d'événements inline dans le JSX).
  - Risque assumé : on pourrait cacher de la logique dans des callbacks pour contourner la limite. C'est la revue de code qui le surveille.
- **Sortie** : chaque violation est signalée avec le chemin, la valeur mesurée et la limite. Le code de sortie vaut 1 s'il y a au moins une violation.

## Analyseur (incertitude à lever à l'étape 5)

- TypeScript 7.0.2 est la version courante sur npm, et je ne sais pas si son API de compilation JavaScript est disponible comme avant.
- `@typescript-eslint/typescript-estree` 8.71.2 n'accepte que TypeScript inférieur à 6.1.
- Options : figer `typescript@6` pour le script, ou utiliser un autre analyseur. On tranche après un essai rapide à l'étape 5.

## Tests du script

- Les cas en échec (6 fonctions, 6 fichiers, 4 niveaux) sont générés dans un dossier temporaire pendant le test, et non commités. Sinon, ils feraient échouer le contrôle du dépôt lui-même.
- Le dépôt réel doit passer le contrôle.
