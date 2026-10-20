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

## Amendement du 2026-10-20 : résultat d'un essai (T15)

- **Route.** `PATCH /api/attempts` enregistre le score calculé par le bac à sable, une seule fois. Une transaction refuse un second envoi (409, S5) et un essai en erreur. Les résultats doivent reprendre exactement les tests du kata, dans l'ordre, avec un statut connu ; le score est recalculé côté serveur.
- **Essai d'un autre utilisateur.** Il reçoit la même réponse qu'un essai inexistant (404, CA6.5), pour ne pas révéler qu'il existe.
- **Score.** Il reste falsifiable par le client tant que le bac à sable serveur (T2) n'existe pas. C'est accepté en T1, puisqu'il n'y a ni classement ni succès.
- **Profondeur des routes.** La route de résultat partage le fichier `app/api/attempts/route.ts` (méthode `PATCH`) : un sous-dossier `result` aurait dépassé la limite de 3 niveaux de sous-dossiers.

## Amendement du 2026-10-20 : lecture côté client réalisée (T16)

- **Lectures directes sous les règles.** L'historique et le détail d'un essai sont lus par le navigateur avec le SDK client Firestore, sous les règles « lecture par le propriétaire uniquement ». L'historique est un abonnement en direct, ce qui affiche un nouvel essai ou un nouveau score sans recharger la page. Il s'appuie sur l'index composé `attempts (uid, kataId, createdAt desc)`, à déployer avec les règles en T21.
- **Essai d'un autre utilisateur.** Les règles refusent sa lecture, et l'interface affiche alors le même message qu'un essai inexistant (CA6.5). Un test sur les émulateurs le vérifie avec le SDK client, et un test de bout en bout avec un second compte.
- **Une seule conversion des documents.** `attemptViewFromData` (`lib/attempts.ts`) sert au serveur comme au navigateur.
- **Limite d'essais et contention.** La transaction de la limite d'essais (T14) passe à 10 tentatives au plus. Le test des requêtes parallèles, instable une fois sur trois sur l'émulateur, est stabilisé à 6 requêtes avec un délai adapté : il vérifie l'exactitude, pas la vitesse.
- **Déconnexion.** Elle ne déclenche plus de navigation : la garde des pages protégées est la seule à rediriger. Les tests de bout en bout sous Firefox et WebKit ont révélé une course entre deux navigations, désormais supprimée.

## Amendement du 2026-10-20 : sécurité transverse réalisée (T20)

- **CSP à nonce** (`proxy.ts`, `lib/content-security-policy.ts`) : un nonce neuf par requête, que Next.js applique à ses propres scripts.
  - `script-src` : `'self'`, le nonce, l'empreinte SHA-256 du script d'amorçage du bac à sable, et `blob:` pour son worker. Ni `'unsafe-inline'` ni `'unsafe-eval'` en production.
  - `'strict-dynamic'` est écarté : il désactiverait `blob:`, que le worker du bac à sable utilise pour charger le code généré.
  - `connect-src` : uniquement les points d'accès Firebase, plus les émulateurs pour les builds de test.
  - `frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'`, et `upgrade-insecure-requests` hors émulateurs.
- **Attributs `style` en ligne autorisés** (`style-src-attr 'unsafe-inline'`). WebKit applique des attributs `style` à ses propres contrôles de formulaire (`<select>`) et signalait des violations. Les éléments et feuilles de style restent soumis au nonce. Un attribut de style n'exécute pas de script et ne peut pas utiliser de sélecteurs.
- **Rendu à la demande.** Le nonce n'existe qu'à la requête, donc toutes les pages sont rendues à la demande (`await connection()` dans la disposition racine).
- **Firebase Auth sans fenêtre surgissante ni redirection** (`initializeAuth` avec persistance IndexedDB, puis local storage). KatAI n'utilise que l'e-mail et le mot de passe : le SDK ne charge plus le script `apis.google.com/js/api.js`, que la CSP refusait sous WebKit.
- **En-têtes sur toutes les réponses** : `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`.
- **S7.** Un test vérifie que le code serveur n'appelle jamais `fetch` directement et ne contient aucune adresse hors de la liste fermée (`api.anthropic.com`).
- **S8 et journaux.** KatAI n'écrit aucun journal applicatif en T1. Les tests espions de console vérifient que les routes de clés et de soumission ne journalisent jamais la clé. Un journal structuré avec masquage viendra avec l'observabilité (T2), pour ne pas livrer de code sans usage.
- **Bug révélé par les tests sous charge, corrigé.** Un formulaire rempli avant l'hydratation perdait sa saisie : le champ affichait le texte, mais l'état React restait vide. Les formulaires de connexion, d'inscription et de réinitialisation lisent désormais leurs champs au moment de l'envoi.
- **Vérification.** Un test de bout en bout contrôle les en-têtes et l'unicité du nonce, puis fait un essai complet (Firebase, modèle, iframe et worker du bac à sable) sans aucune violation de CSP dans les 3 navigateurs. La suite complète est passée 3 fois de suite (66/66).
