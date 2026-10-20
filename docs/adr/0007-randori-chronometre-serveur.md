# ADR 0007 : Randori et chronomètre serveur

Statut : accepté le 2026-10-19.

## Contexte

Hypothèses HR1 à HR6 et critères CA7.1 à CA7.11. Manipuler l'horloge du navigateur ne doit rien changer (CA7.5).

## Options

| Option | Statut |
|---|---|
| A. Chronomètre côté client uniquement | Écartée : falsifiable |
| B. Horodatages serveur, échéance vérifiée à chaque action | Retenue |
| C. Clôture planifiée côté serveur (tâche programmée) | Écartée : infrastructure en plus, inutile tant que la clôture paresseuse suffit |

## Choix

B : horodatages serveur, échéance vérifiée à chaque action.

## Détails

**`POST /api/randori/start`**
- Vérifie la clé du fournisseur choisi (CA7.10).
- Clôt en `timeout` les randoris `running` dont l'échéance est passée.
- Refuse si un randori `running` est encore actif (HR6, CA7.9).
- Crée sinon le randori : `startedAt` vaut l'heure du serveur, `deadline` vaut `startedAt` plus la durée du niveau (10, 15 ou 20 min).

**Soumission d'un essai rattaché à un randori**
- Contrôle, dans l'ordre et avant tout appel au fournisseur : propriétaire, statut `running`, heure du serveur antérieure à `deadline`. Sinon, refus (CA7.5).
- `attemptsCount` augmente à la création de l'essai.

**Enregistrement d'un résultat**
- Met à jour `bestPassed`.
- Si `passed == total`, le randori passe à `succeeded`, avec `bestElapsedMs = createdAt de l'essai − startedAt` (CA7.3).
- Le résultat d'un essai créé avant l'échéance compte, même s'il arrive après (CA7.6).

**`POST /api/randori/abandon`** : le randori passe à `abandoned`, et son meilleur score est conservé (CA7.8).

**Affichage**
- Chaque réponse inclut `serverNow`, ce qui permet au client de corriger le décalage de son horloge.
- Le compte à rebours est calculé à partir de `deadline` (CA7.7).
- Un randori `running` dont l'échéance est passée s'affiche comme terminé ; le serveur le clôt à la prochaine action.

## Conséquences

- Seule l'horloge du serveur fait foi.
- Le score reste rapporté par le client, donc falsifiable. C'est accepté en T1.
- Tests : échéance dépassée, soumission refusée sans appel au fournisseur, résultat tardif accepté, randori unique, abandon. Ils tournent contre l'émulateur, avec une horloge injectable.

## Amendement du 2026-10-20 : réalisation côté serveur (T18)

- **Routes.** `POST /api/randoris` démarre un randori, `PATCH /api/randoris` l'abandonne, et `GET /api/randoris?id=` le relit. Chaque réponse porte `serverNow`. Une soumission d'essai rattachée à un randori passe par `POST /api/attempts` avec `randoriId`.
- **Démarrage.** Il se fait dans une transaction : les randoris `running` dont l'échéance est passée sont clos en `timeout`, et un randori encore actif bloque le lancement (HR6, CA7.9). La durée vient du niveau du kata : 10, 15 ou 20 minutes.
- **Soumission.** Avant toute limite d'essais et tout appel au modèle, elle vérifie le propriétaire, le kata, le statut et l'heure d'arrivée de la requête face à l'échéance (CA7.5). `attemptsCount` augmente à la création de l'essai.
- **Résultat.** Il met à jour `bestPassed` pour tout essai soumis avant l'échéance, même si le résultat arrive après (CA7.6). Le premier score parfait clôt le randori en `succeeded`, avec `bestElapsedMs` mesuré entre le début et la soumission de cet essai (CA7.3).
- **Statut effectif.** Un randori `running` dont l'échéance est passée est présenté comme `timeout` avant même d'être clos en base (`effectiveRandoriStatus`, partagé avec le client).
- **Horloge injectable.** Les fonctions serveur prennent l'heure en paramètre, ce que les tests exploitent. Une mutation qui supprime le contrôle de l'échéance est détectée.

## Amendement du 2026-10-20 : interface réalisée (T19)

- **Section `/randori`.** Chaque kata y figure avec sa durée, un bouton de lancement et l'historique de ses randoris (CA7.11). Un refus renvoie vers le randori en cours (CA7.9) ou vers les réglages s'il manque la clé (CA7.10).
- **Page `/randori/[id]`.** Elle lit une fois le randori par l'API, pour mesurer l'écart entre l'horloge du navigateur et celle du serveur (`serverNow`), puis le suit en direct par Firestore côté client, sous les règles du propriétaire. Le compte à rebours applique cet écart (CA7.7), et le meilleur score, le nombre d'essais et la réussite apparaissent dès que le serveur les enregistre.
- **Fin du temps.** À l'échéance, le formulaire se ferme sans attendre la clôture côté serveur (CA7.4), et le serveur refuse de toute façon une soumission tardive (CA7.5).
- **Statut affiché.** L'historique calcule le statut effectif à l'arrivée des données, pas pendant le rendu : ESLint signalait à juste titre un appel à `Date.now()` dans le rendu.
- **Tests.** Tests de composants avec horloge simulée (fin du temps, réussite, abandon). Tests de bout en bout dans les 3 navigateurs : lancement, reprise après rechargement, deux essais jusqu'à la réussite, historique, randori unique, clé manquante, abandon. L'expiration réelle en 10 minutes reste couverte par les tests serveur avec horloge injectée.
