# ADR 0002 : authentification et modèle de données

Statut : accepté le 2026-10-19.

## Contexte

L'offre gratuite de Supabase n'a plus d'emplacement disponible, et l'intention retient Firebase. Il faut :
- une connexion par e-mail et mot de passe, avec réinitialisation (H1, CA1.8) ;
- un stockage des essais, des randoris, des clés chiffrées et des compteurs de limite d'essais.

## Options

**Base de données**
- A. Cloud Firestore : requêtes composées, règles par document, émulateur.
- B. Realtime Database : modèle arborescent, requêtes plus pauvres.

**Katas**
- A. Collection Firestore remplie par un script.
- B. Fichiers TypeScript versionnés dans le dépôt.

## Choix

- Firebase Authentication, par e-mail et mot de passe, avec l'e-mail de réinitialisation et la page fournis par Firebase.
- Cloud Firestore.
- Katas en fichiers TypeScript versionnés (option B) : énoncé, signature, nom de fonction, niveau, tests déclaratifs. Ils sont importés par le serveur comme par le navigateur.
  - Amendement du 2026-10-19 : l'énoncé devient un brief client (`brief`), et chaque kata gagne un secteur (`sector`), une étape du cycle (`stage`) et une compétence entraînée (`practice`). Format : `katas/types.ts`.

## Raisons

- Comme les katas sont dans le dépôt, aucun chemin d'écriture en base ne les concerne, et S4 est satisfaite par construction. Ils sont versionnés avec leurs tests, et le dépôt est public de toute façon.
- Firestore couvre l'historique trié et la recherche du randori en cours grâce à des index composés.

## Schéma

| Collection | Identifiant | Champs |
|---|---|---|
| `attempts` | automatique | `uid`, `kataId`, `randoriId` (ou null), `provider`, `model` (demandé), `servedModel` (réellement utilisé), `spec`, `code` (ou null), `status` (`generated`, `done`, `error`), `errorCategory` (ou null), `truncated`, `latencyMs`, `inputTokens`, `outputTokens`, `createdAt`, `result` (ou null) : `{ passed, total, tests: [{ label, status }] }` |
| `randoris` | automatique | `uid`, `kataId`, `status` (`running`, `succeeded`, `timeout`, `abandoned`), `startedAt`, `deadline`, `bestPassed`, `total`, `attemptsCount`, `bestElapsedMs` (ou null) |
| `providerKeys` | `{uid}_{provider}` | `uid`, `provider`, `ciphertext`, `iv`, `authTag`, `keyVersion`, `updatedAt` |
| `usage` | `{uid}` | `recentSubmissions` : horodatages de la dernière minute (limite de 5 par minute) |

Index composés :
- `attempts` (`uid`, `kataId`, `createdAt` décroissant) ;
- `randoris` (`uid`, `kataId`, `startedAt` décroissant) ;
- `randoris` (`uid`, `status`).

## Conséquences

- **Région Firestore** : européenne. Ce choix est définitif ; le nom exact se confirme à la création du projet.
- **Quotas officiels de l'offre Spark** : 50 000 lectures, 20 000 écritures et 20 000 suppressions par jour, 1 Gio stocké. Un essai coûte environ 4 écritures, ce qui laisse une large marge en T1.
- **Documentation des changements** : tout changement de schéma ou de règles met à jour cet ADR ou en ajoute un nouveau, et porte un commentaire d'en-tête dans `firestore.rules` (objet, collections touchées, effet sur les règles, retour arrière). C'est l'équivalent des migrations documentées.
