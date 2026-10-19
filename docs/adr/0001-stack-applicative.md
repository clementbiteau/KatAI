# ADR 0001 : stack applicative

Statut : proposé, 2026-10-19.

## Contexte

La tranche 1 a besoin :
- d'une interface ;
- de routes serveur qui manipulent des secrets (clés chiffrées, appels aux modèles) ;
- d'un bac à sable JavaScript dans le navigateur.

L'hébergement possible est Vercel ou Streamlit. Le développement local doit fonctionner sans compte d'hébergeur. Les limites de structure s'appliquent : 5 fonctions par fichier, 5 fichiers par dossier, 3 niveaux de sous-dossiers.

## Options

| Option | Pour | Contre |
|---|---|---|
| A. Next.js (App Router) et TypeScript, sur Vercel | Un seul serveur de développement pour le front et les routes (`next dev`), sans connexion à Vercel ; déploiement natif ; TypeScript partout (katas, bac à sable, serveur) | Conventions de fichiers imposées (`page.tsx`, `route.ts`) ; routage par dossiers, attention à la profondeur |
| B. Vite + React SPA et fonctions Vercel (`api/`) | Structure très plate | Les routes locales demandent `vercel dev`, donc un compte connecté, ou un proxy maison |
| C. Streamlit (Python) | Rapide pour un prototype | Le code s'exécute sur le serveur, à côté des secrets ; un bac à sable JavaScript dans le navigateur n'y est pas naturel |
| D. SvelteKit | Léger | Aucun avantage décisif ici, et un écosystème Firebase moins documenté |

## Choix

A : Next.js (App Router) et TypeScript, hébergé sur Vercel.

## Raisons

- Les routes serveur forment la frontière de sécurité : les secrets ne quittent jamais ces routes.
- Le développement local et la CI tournent sans compte d'hébergeur.
- Avec un seul langage, les katas sont partagés tels quels entre le serveur (signature envoyée au modèle) et le navigateur (tests).

## Conséquences

- **Versions relevées sur npm le 2026-10-19** : `next` 16.4.2, `react` 19.3.1, `typescript` 7.0.2, `vitest` 5.0.5, `@playwright/test` 1.64.1.
  - La compatibilité de Next 16 avec TypeScript 7 sera vérifiée en première tâche de construction, avec un repli possible sur TypeScript 6.
  - Next 16.4.2 demande Node 20.9 ou plus. La version de Node exécutée par Vercel sera fixée en première tâche.
- **Arborescence pour tenir les 3 niveaux** :
  - pas de dossier `src/` ;
  - routes plates : `app/api/keys/route.ts` fait 3 niveaux ;
  - aucun segment dynamique imbriqué : la comparaison passe par `app/compare/page.tsx?a=…&b=…`.
- **Tests** : une arborescence `tests/` séparée, qui reproduit celle du code. Placer les tests à côté du code doublerait le nombre de fichiers par dossier.
- **Styles** : CSS natif ou modules CSS, sans framework de styles, pour éviter des fichiers de configuration en plus à la racine.
- **Offre Hobby de Vercel** : elle est prévue pour un usage personnel, à revoir si le produit devient commercial.
