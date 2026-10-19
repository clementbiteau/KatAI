# ADR 0003 : modèle de sécurité

Statut : accepté le 2026-10-19.

## Contexte

Exigences S1 à S9 de la spec :
- isolation des données entre utilisateurs ;
- clés inaccessibles depuis le client ;
- invariants qui ne doivent pas dépendre du client : échéance du randori, limite d'essais, métriques de l'essai.

## Options

- A. Le client écrit directement dans Firestore, et des règles fines valident chaque champ.
- B. Le client lit, le serveur écrit. Les règles n'autorisent que la lecture de ses propres documents ; toute écriture passe par une route serveur, avec le SDK Admin.

## Choix

B : le client lit, le serveur écrit.

## Raisons

- Les règles deviennent minimales, donc faciles à relire et à tester.
- Les invariants (échéance, limite d'essais, métriques, essai non modifiable une fois son résultat enregistré) sont appliqués à un seul endroit, côté serveur.
- S5 et S9 sont satisfaites par construction, puisqu'aucun client n'écrit.

## Règles Firestore

- Refus par défaut sur tout chemin non listé.
- `attempts` et `randoris` : lecture si `resource.data.uid == request.auth.uid` ; aucune écriture.
- `providerKeys` et `usage` : aucun accès client.

## Côté serveur

- Chaque route vérifie le jeton d'identité Firebase avec le SDK Admin et en tire le `uid`. Le `uid` ne vient jamais du corps de la requête (S6).
- Toutes les écritures passent par un seul module d'accès aux données, marqué serveur uniquement. Chaque fonction de ce module reçoit le `uid` vérifié.
- Les journaux masquent les secrets : aucun corps de requête de `/api/keys` n'est journalisé (CA2.7, S8).
- Les pages portent une politique de sécurité de contenu (CSP) stricte, plus `frame-ancestors 'none'`. Le code généré s'affiche toujours comme du texte, jamais comme du HTML.

## Tests

| Exigence | Test |
|---|---|
| S1 à S5, S9 | Règles testées sur l'émulateur Firestore avec `@firebase/rules-unit-testing` (6.0.0) |
| S6 | Tests des routes : sans jeton ou avec un jeton invalide, la route répond 401 |
| S2, S5, S9 côté serveur | Tests du module d'accès aux données contre l'émulateur |
| S7 | Test qui vérifie que les clients des fournisseurs sont construits avec l'adresse fixe (ADR 0005) |
| S8, CA2.7 | Test avec un journal espionné : la clé n'y apparaît jamais |

## Conséquences et risques résiduels

- **Le SDK Admin contourne les règles.** Le risque est concentré dans le module d'accès aux données, d'où ses tests dédiés.
- **Le score reste falsifiable.** Le client rapporte le résultat des tests au serveur. C'est accepté en T1 (intention), et le bac à sable serveur arrive en T2.
- **Une faille XSS exposerait le jeton Firebase**, stocké côté client. Parades : CSP stricte, échappement natif de React, aucun `dangerouslySetInnerHTML`.

## Amendement du 2026-10-19 : socle serveur réalisé (T10)

- **Module d'accès aux données.** Avec la limite de 5 fonctions par fichier, le module unique devient le dossier `lib/server/data/`, avec un fichier par collection. C'est le seul endroit autorisé à appeler `getAdminDb()`, qui contourne les règles.
- **Code serveur uniquement.** Tout le code serveur importe `server-only` : un import depuis le navigateur fait échouer le build.
- **Garde-fou sur les émulateurs.** Avec les variables d'émulateur, le SDK Admin accepte des jetons non signés. Ces variables sont donc refusées à côté d'un vrai compte de service et sur tout déploiement Vercel (`VERCEL_ENV`), ce que vérifie un test unitaire.
- **Routes.** `withUser` vérifie le jeton Firebase, révocation comprise, avant tout traitement, et répond 401 sinon (S6). Les réponses personnelles portent `Cache-Control: no-store`.
- **Tests.** Route `GET /api/keys` testée sur les émulateurs : 401 dans quatre cas de jeton absent ou invalide, statut des seules clés de l'appelant, jamais de chiffré dans la réponse. Une mutation qui supprime la vérification du jeton fait échouer ces tests.
