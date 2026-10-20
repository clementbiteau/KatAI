# KatAI : plan de la tranche 1

Statut : étape 4, validée le 2026-10-19. Date : 2026-10-19.

Sources :
- `docs/intent.md` v4 (validée, amendée) ;
- `docs/spec.md` v2 (validée, amendée) ;
- `docs/adr/0001` à `0009` (acceptés).

## Règles d'exécution

- Une tâche dure 1 h au plus. Chacune suit le même cycle : tests d'abord, code minimal, exécution des tests, petit commit au message clair, puis présentation des résultats avant la tâche suivante (étape 6).
- Une tâche n'est terminée que si sa vérification passe.
- Branches et pull requests :
  - le premier push se fait directement sur `main` (tâche T5), puisque le dépôt est vide ;
  - ensuite, une branche et une PR par lot, avec 8 lots en tout ;
  - tout push demande ton accord explicite, et ta validation de la fusion vaut accord de déploiement (ADR 0008).
- Les durées sont des estimations. Si une tâche dépasse son estimation de plus de 50 %, je le signale et je propose de la découper ou de réduire son périmètre.
- Marquage des actions :
  - « (toi) » : ce que toi seul peux faire (comptes, secrets, réglages) ;
  - « (accord) » : ce que je fais seulement après ton accord explicite.

## Phase A : garde-fous (étape 5)

| # | Tâche | Durée | Vérification |
|---|---|---|---|
| T0 | Installer un JDK 21, nécessaire à l'émulateur Firestore (accord : `brew install --cask temurin@21`, ou toi) | 10 min | `java -version` affiche 21 |
| T1 | Squelette Next.js 16 et TypeScript, sans `src/`. Vitest configuré, page d'accueil minimale. Test de compatibilité TypeScript 7, avec repli sur TypeScript 6 (ADR 0001) | 45 min | `npm run build` passe ; `npm test` passe avec un test de fumée |
| T2 | Script de contrôle de structure : essai de l'analyseur, puis les règles de l'ADR 0009. Tests sur des cas en échec générés dans un dossier temporaire | 1 h | Les tests échouent sur les 3 cas en violation ; `npm run check:structure` passe sur le dépôt |
| T3 | `CLAUDE.md` (conventions, commandes, interdits), `LICENSE` MIT, `.gitignore`, `.env.example`, ESLint. Hook avant commit et configuration gitleaks | 45 min | `npm run lint` passe ; un faux secret placé dans un dépôt temporaire est détecté |
| T4 | Configuration des émulateurs Firebase (projet `demo-katai`), `firestore.rules` avec refus par défaut. Harnais `@firebase/rules-unit-testing`, premiers tests S1 à S4 | 1 h | `npm run test:rules` passe sur l'émulateur |
| T5 | Workflow CI : qualité, tests avec émulateurs, secrets. Premier push sur `main` (accord), puis protection de branche via `gh` (autorisée). Import du dépôt dans Vercel (toi). Activation de la détection de secrets et de la protection au push GitHub (toi) | 45 min | CI verte sur GitHub ; un push direct sur `main` est refusé ; la page d'accueil est en ligne sur Vercel |

L'étape 5 est terminée quand T0 à T5 sont faits. Les tâches suivantes forment l'étape 6.

## Phase B : construction (étape 6)

| # | Tâche | Lot | Durée | Vérification |
|---|---|---|---|---|
| T6 | Format d'un kata, puis 3 énoncés en anglais et 8 à 12 tests déclaratifs par kata (toi : validation des énoncés). Solutions de référence dans `tests/`. Refaite le 2026-10-19 : katas recadrés en briefs clients retail, luxe et banque (intention, section 8 bis) | L2 | 1 h, plus 1 h de reprise | Les solutions de référence réussissent 100 % des tests ; une solution naïve en échoue au moins 2 par kata |
| T7 | Prototype du bac à sable : iframe d'origine opaque, worker créé depuis un Blob, CSP sans réseau. Job Playwright ajouté à la CI | L2 | 1 h | Tests Playwright : fonction correcte réussie ; erreur de syntaxe signalée (CA4.8) ; boucle infinie arrêtée à 5 s (CA4.9) ; `fetch`, `localStorage` et `indexedDB` inaccessibles (CA4.10). Si le prototype échoue, bascule sur le repli D de l'ADR 0006 |
| T8 | Exécuteur de tests intégré, avec un résultat par test (réussi, échoué, délai dépassé) | L2 | 45 min | Playwright : la solution de référence de K1 atteint 100 % ; la solution naïve obtient le score attendu |
| T9 | Authentification : client Firebase ; inscription, connexion, déconnexion, réinitialisation ; garde des pages protégées | L3 | 1 h | Tests contre l'émulateur Auth (CA1.1 à CA1.9) ; parcours manuel |
| T10 | Base serveur : vérification du jeton (S6) et module d'accès aux données avec le SDK Admin (ADR 0003). Ajusté le 2026-10-19 : inclut la première route réelle, `GET /api/keys` (état des clés), pour ne pas livrer de code sans usage ; T11 garde l'enregistrement, la suppression et le chiffrement | L3 | 45 min | Tests des routes : 401 sans jeton ou avec un jeton invalide, 200 avec un jeton valide de l'émulateur |
| T11 | Chiffrement des clés (ADR 0004), routes `/api/keys` (enregistrer, état, supprimer), page de réglages | L4 | 1 h | Tests unitaires du chiffrement (aller-retour, données associées, chiffré altéré) ; tests des routes CA2.1 à CA2.7 ; journal espionné sans la clé |
| T12 | Adaptateur Anthropic : SDK, adresse fixe, aucune nouvelle tentative, délai, effort `low`, 16 000 tokens, repli, correspondance des erreurs, extraction du code (ADR 0005) | L5 | 1 h | Tests unitaires avec un SDK simulé : chaque catégorie d'erreur, réponse sans code, réponse tronquée, clé toujours explicite. Un appel réel avec ta clé (toi), hors CI |
| T13 | Adaptateur OpenAI : vérification préalable des modèles et de l'API sur la documentation officielle, puis même périmètre que T12. **Reportée le 2026-10-20** : OpenAI passe en Could, sur décision du porteur du projet. La vérification préalable faite est consignée dans l'ADR 0005 | L5 | 1 h | Mêmes tests que T12 ; un appel réel avec ta clé (toi), hors CI |
| T14 | Route de soumission d'un essai : limite de 5 par minute (transaction), prompt H2, appel, enregistrement de l'essai et des métriques | L5 | 1 h | Tests contre l'émulateur, adaptateurs simulés : CA4.3, CA4.4, CA4.5, CA4.6, CA4.7, CA4.11 ; vérification que ni l'énoncé ni les tests ne sont envoyés (H2) |
| T15 | Section Kata : catalogue, énoncé, éditeur de spécification, soumission, code affiché en texte, exécution, enregistrement du résultat une seule fois | L6 | 1 h | Tests des composants (CA3.1 à CA3.3, CA4.2, CA4.12) ; test de la route de résultat (une seule écriture, S5) ; parcours manuel |
| T16 | Historique d'un kata et détail d'un essai (US5) | L6 | 45 min | Tests des composants CA5.1 à CA5.3 ; règle « lecture de ses propres essais uniquement » vérifiée |
| T17 | Comparaison de deux essais en deux colonnes (US6) | L6 | 45 min | Tests des composants CA6.1 à CA6.6 (critère R2) |
| T18 | Randori côté serveur : lancement, abandon, contrôle de l'échéance à la soumission, mise à jour au résultat, horloge injectable (ADR 0007) | L7 | 1 h | Tests contre l'émulateur : CA7.1, CA7.3 à CA7.6, CA7.8 à CA7.10, S9 |
| T19 | Randori côté interface : compte à rebours corrigé par `serverNow`, écran de résultat, historique des randoris | L7 | 1 h | Tests des composants CA7.2, CA7.7, CA7.11 ; parcours manuel |
| T20 | Sécurité transverse : en-têtes CSP et `frame-ancestors`, journal masquant les secrets, tests S7 et S8 | L8 | 45 min | Tests ; en-têtes vérifiés sur la prévisualisation Vercel |
| T21 | Projet Firebase réel (toi : création, région européenne, Auth e-mail), comptes de service et secrets Vercel et GitHub (toi). Job de déploiement des règles et des index | L8 | 45 min | Job de déploiement vert ; règles visibles dans la console Firebase |
| T22 | Déploiement en production et parcours de bout en bout avec ta clé : 3 katas, 2 essais comparés, 1 randori | L8 | 45 min | R1, R2, R3 et R8 constatés et consignés pour `docs/retro.md` |
| T23 | README minimal : installer, lancer, tester, sécurité, rotation de la clé maîtresse | L8 | 30 min | Une installation depuis un clone neuf, en suivant le README, passe les tests |

**Lots et PR** :

| Lot | Tâches | Contenu |
|---|---|---|
| L1 | T0 à T5 | Garde-fous, poussés directement sur `main` |
| L2 | T6 à T8 | Katas et bac à sable |
| L3 | T9 et T10 | Authentification et base serveur |
| L4 | T11 | Clés |
| L5 | T12 à T14 | Fournisseurs et soumission |
| L6 | T15 à T17 | Section Kata, historique, comparaison |
| L7 | T18 et T19 | Randori |
| L8 | T20 à T23 | Sécurité, déploiement, README |

## Ligne de coupe (intention, section 9)

1. Le Randori (T18, T19) passe en ouverture de T2.
2. OpenAI (T13) sort de T1. **Appliqué le 2026-10-20**, OpenAI passant en Could : la route T14 et l'interface ne proposent qu'Anthropic.
3. Le job de déploiement des règles (T21) est remplacé par un déploiement manuel documenté.

La CI n'est jamais coupée.

## Estimation et horizon

- Total estimé : environ 20 h de travail, réparties en 24 tâches (4 h 25 de garde-fous, 15 h 45 de construction).
- Décision du 2026-10-19 : aucun plafond ni horizon de temps, la qualité prime. Une estimation dépassée n'est jamais une raison de couper la qualité. Elle est seulement signalée, et on découpe la tâche si besoin.
- Les temps réels seront relevés par tâche, à partir des commits, pour `docs/retro.md` (R7).

## Ce dont j'ai besoin de toi, dans l'ordre

| Quand | Action |
|---|---|
| T0 | Accord pour installer le JDK 21 avec Homebrew, ou installation par toi |
| T5 | Accord pour le premier push ; import du dépôt dans Vercel ; activation de la détection de secrets et de la protection au push GitHub |
| T6 | Validation des 3 énoncés |
| T12 et T13 | Un appel réel avec ta clé, saisie par toi dans l'application locale, jamais dans le chat |
| T21 | Création du projet Firebase ; comptes de service ; saisie des secrets dans Vercel et GitHub |
| Chaque lot | Accord de push, puis validation de la fusion de la PR |
