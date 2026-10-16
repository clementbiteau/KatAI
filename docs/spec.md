# KatAI : spécification de la tranche 1

Statut : étape 2, à valider. Date : 2026-10-16. Source : `docs/intent.md` v4, validée.

## 1. Périmètre

**Dans la tranche 1** :
- US1 Compte ;
- US2 Clés fournisseur ;
- US3 Catalogue ;
- US4 Jouer un essai ;
- US5 Historique ;
- US6 Comparer ;
- exigences de sécurité S1 à S8 ;
- exigences de CI et de déploiement N1 à N4.

**Hors tranche 1** :
- réinitialisation du mot de passe et vérification de l'e-mail ;
- suppression du compte et export des données (requis avant d'ouvrir le produit à d'autres, donc en T2) ;
- suppression d'un essai ;
- mise en évidence des différences ;
- compte démo et tableau d'observabilité ;
- bac à sable serveur ;
- autres langages que JavaScript ;
- partage.

## 2. Hypothèses produit (à valider)

| # | Hypothèse | Conséquence |
|---|---|---|
| H1 | Authentification par e-mail et mot de passe | Aucun fournisseur d'identité tiers à configurer |
| H2 | Le modèle reçoit uniquement la spécification de l'utilisateur, la signature attendue et une consigne de format. Il ne reçoit ni l'énoncé ni les tests | C'est le cœur de l'exercice : l'utilisateur doit transmettre lui-même toutes les règles de l'énoncé dans sa spécification |
| H3 | Une clé au plus par fournisseur et par utilisateur | Enregistrer une nouvelle clé remplace l'ancienne |
| H4 | Le modèle renvoie du JavaScript, pas du TypeScript | Pas de transpilation dans le bac à sable en T1 |
| H5 | L'utilisateur voit le libellé et le statut de chaque test, mais pas leur code | Le retour reste utile sans livrer la solution dans l'interface (le code des tests reste lisible dans le dépôt public, risque accepté) |
| H6 | Le catalogue et les énoncés sont publics ; jouer exige d'être connecté | Un visiteur peut découvrir le produit avant de s'inscrire |
| H7 | Interface et katas en anglais ; documents de démarche en français | Produit public pour développeurs. Les libellés des critères ci-dessous décrivent le sens, pas le texte exact |

**Valeurs proposées, ajustables :**

| Paramètre | Valeur |
|---|---|
| Longueur maximale d'une spécification | 4 000 caractères |
| Plafond de tokens en sortie par appel | 4 096 |
| Essais par utilisateur | 5 par minute au plus |
| Délai maximal d'un appel au fournisseur | 60 s (à confronter en étape 3 à la limite de l'hébergeur) |
| Délai maximal d'exécution des tests | 5 s par essai |
| Longueur acceptée pour une clé | 20 à 300 caractères, sans espace |
| Mot de passe | 8 caractères au moins |

## 3. Katas de départ

Ce sont des katas originaux. Leurs règles sont volontairement précises : une spécification vague doit échouer à une partie des tests. Les énoncés complets et 8 à 12 tests par kata seront écrits à l'étape 6, et soumis à ta validation.

| # | Kata | Signature attendue | Niveau | Ce qui piège une spécification vague |
|---|---|---|---|---|
| K1 | Cart total | `cartTotal(lines) -> number`, en centimes | Facile | Ordre d'application de deux remises, arrondi, quantités nulles |
| K2 | Slugify | `slugify(title) -> string` | Moyen | Accents, séparateurs multiples, longueur maximale sans couper un mot |
| K3 | Free slots | `freeSlots(meetings, minMinutes) -> slots` | Difficile | Rendez-vous qui se chevauchent ou débordent de la journée, durée minimale, ordre du résultat |

## 4. User stories et critères d'acceptation

### US1 Compte

En tant qu'utilisateur, je veux créer un compte et me connecter, afin que mes clés et mes essais me soient propres.

- **CA1.1** Étant donné un visiteur sur la page d'inscription, quand il saisit un e-mail valide et un mot de passe conforme, alors son compte est créé, il est connecté et il arrive sur le catalogue.
- **CA1.2** Étant donné un e-mail déjà inscrit, quand un visiteur tente de s'inscrire avec, alors l'inscription échoue. Le message invite à se connecter, sans confirmer explicitement que le compte existe.
- **CA1.3** Étant donné un compte existant, quand l'utilisateur saisit des identifiants valides, alors il est connecté.
- **CA1.4** Étant donné des identifiants invalides, quand l'utilisateur tente de se connecter, alors un message générique s'affiche, sans préciser si c'est l'e-mail ou le mot de passe qui est faux.
- **CA1.5** Étant donné trop de tentatives échouées, quand l'utilisateur réessaie, alors un message lui demande de patienter.
- **CA1.6** Étant donné un utilisateur connecté, quand il se déconnecte, alors sa session prend fin, et les pages protégées le renvoient vers la connexion.
- **CA1.7** Étant donné un visiteur sans session, quand il ouvre une page protégée (réglages, essai, historique, comparaison), alors il est renvoyé vers la connexion.

### US2 Clés fournisseur

En tant qu'utilisateur connecté, je veux enregistrer ma clé API OpenAI ou Anthropic, afin que KatAI appelle mon modèle à mes frais sans jamais exposer ma clé.

- **CA2.1** Étant donné un utilisateur sans clé Anthropic, quand il saisit une clé de forme valide et l'enregistre, alors :
  - le serveur la chiffre et la stocke ;
  - le champ se vide ;
  - la page affiche « Anthropic : configurée », avec la date ;
  - aucune réponse ne contient la clé.
- **CA2.2** Étant donné une clé configurée, quand l'utilisateur recharge les réglages, alors seuls le statut et la date s'affichent, sans aucun fragment de la clé (pas même les derniers caractères).
- **CA2.3** Étant donné une clé configurée, quand l'utilisateur en enregistre une nouvelle pour le même fournisseur, alors l'ancienne est remplacée.
- **CA2.4** Étant donné une clé configurée, quand l'utilisateur la supprime, alors le document chiffré est effacé et le statut passe à « non configurée ». Ses essais passés restent intacts.
- **CA2.5** Étant donné une saisie vide, hors des longueurs acceptées ou contenant des espaces, quand l'utilisateur l'enregistre, alors elle est refusée avec un message, et rien n'est stocké.
- **CA2.6** Étant donné une requête d'enregistrement sans jeton d'identité valide, quand elle atteint le serveur, alors elle est rejetée (401), et rien n'est stocké.
- **CA2.7** Étant donné une opération quelconque sur une clé, quand le serveur journalise, alors la clé en clair n'apparaît dans aucun journal.

### US3 Catalogue

En tant que visiteur ou utilisateur, je veux voir les katas et leur énoncé, afin de choisir lequel pratiquer.

- **CA3.1** Étant donné un visiteur non connecté, quand il ouvre le catalogue, alors il voit les 3 katas, avec leur titre, leur niveau et un résumé.
- **CA3.2** Étant donné un kata ouvert, quand la page s'affiche, alors on voit l'énoncé, la signature attendue et les libellés des tests, mais pas leur code. Pour un visiteur, l'action « S'entraîner » renvoie vers la connexion.
- **CA3.3** Étant donné l'adresse d'un kata inexistant, quand on l'ouvre, alors une page « kata introuvable » propose un lien vers le catalogue.

### US4 Jouer un essai

En tant qu'utilisateur connecté, je veux écrire une spécification, la faire transformer en code par mon modèle et voir le score, afin de mesurer la qualité de ma spécification.

- **CA4.1 Cas nominal.** Étant donné un utilisateur connecté, avec une clé Anthropic configurée et un kata ouvert, quand il écrit une spécification de 1 à 4 000 caractères, choisit un fournisseur et un modèle dans la liste fermée, puis soumet, alors :
  - le serveur appelle le modèle avec la spécification et la signature seulement (H2) ;
  - le code reçu s'affiche ;
  - les tests s'exécutent dans le bac à sable ;
  - le score « réussis / total » s'affiche, avec le statut de chaque test (réussi, échoué, délai dépassé) ;
  - l'essai est enregistré avec : kata, spécification, fournisseur, modèle, code, score, statuts par test, durée de l'appel, tokens en entrée et en sortie, date, statut « terminé ».
- **CA4.2** Étant donné une génération en cours, quand l'utilisateur clique de nouveau, alors rien ne part : le bouton est désactivé et un indicateur d'attente s'affiche.
- **CA4.3** Étant donné aucune clé pour le fournisseur choisi, quand l'utilisateur veut soumettre, alors un message avec un lien vers les réglages remplace le bouton, et aucun appel ne part.
- **CA4.4** Étant donné une spécification vide, alors le bouton est désactivé. Étant donné une spécification de plus de 4 000 caractères, alors le compteur le signale, et la soumission est refusée côté client comme côté serveur (400).
- **CA4.5** Étant donné une clé refusée par le fournisseur, quand l'essai est soumis, alors un message indique que le fournisseur a refusé la clé. L'essai est enregistré avec le statut « erreur » et la catégorie « clé refusée », sans code ni score.
- **CA4.6** Étant donné une limite atteinte chez le fournisseur, une indisponibilité de sa part ou un appel qui dépasse 60 s, quand l'essai est soumis, alors un message adapté s'affiche. L'essai est enregistré en « erreur » avec la catégorie correspondante, et il n'y a pas de nouvelle tentative automatique.
- **CA4.7** Étant donné une réponse du modèle sans bloc de code exploitable, alors l'essai est « terminé » avec un code vide, un score de 0 / total et la mention « aucun code trouvé ».
- **CA4.8** Étant donné un code qui ne se charge pas (erreur de syntaxe, fonction attendue absente), alors tous les tests sont « échoué », l'erreur de chargement s'affiche, et le score vaut 0 / total.
- **CA4.9** Étant donné un code qui boucle sans fin, alors l'exécution s'arrête au bout de 5 s, les tests non terminés passent en « délai dépassé », et la page reste réactive.
- **CA4.10** Étant donné un code qui tente d'accéder au réseau, aux cookies, au stockage ou à la page, alors il n'obtient aucune donnée de session KatAI ni aucun effet hors du bac à sable, et les autres tests continuent.
- **CA4.11** Étant donné 5 essais soumis dans la dernière minute, quand l'utilisateur en soumet un sixième, alors le serveur répond 429 avec le délai d'attente. Aucun appel au fournisseur ne part et aucun essai n'est enregistré.
- **CA4.12** Étant donné une session expirée au moment de la soumission, alors un message invite à se reconnecter, et la spécification reste dans le champ.
- **CA4.13** Étant donné une réponse tronquée par le plafond de tokens, alors l'essai suit CA4.7 ou CA4.8 selon le cas, avec la mention « réponse tronquée ».

### US5 Historique

En tant qu'utilisateur connecté, je veux voir mes essais sur un kata, afin de suivre ma progression.

- **CA5.1** Étant donné 3 essais sur un kata, quand l'utilisateur ouvre l'historique de ce kata, alors ils sont listés du plus récent au plus ancien, avec : date, fournisseur, modèle, score, durée et statut.
- **CA5.2** Étant donné aucun essai, alors un message l'indique, avec un lien pour jouer.
- **CA5.3** Étant donné un essai de la liste, quand l'utilisateur l'ouvre, alors il voit le détail complet : spécification, code, résultat de chaque test et métriques.

### US6 Comparer

En tant qu'utilisateur connecté, je veux comparer côte à côte deux de mes essais sur un même kata, afin de voir ce qui a fait la différence.

- **CA6.1** Étant donné au moins 2 essais sur un kata, quand l'utilisateur en sélectionne 2 dans l'historique et lance la comparaison, alors deux colonnes alignées présentent : spécification, code, score, résultats par test, fournisseur, modèle, durée, tokens et date. L'essai le plus ancien est à gauche.
- **CA6.2** Étant donné 0, 1, ou 3 essais sélectionnés ou plus, alors le bouton de comparaison est désactivé.
- **CA6.3** Étant donné un seul essai sur le kata, alors un message indique qu'il en faut au moins deux.
- **CA6.4** Étant donné un essai en erreur parmi les deux, alors sa colonne affiche le statut et la catégorie d'erreur ; les champs absents sont marqués « — ».
- **CA6.5** Étant donné une adresse de comparaison qui vise l'essai d'un autre utilisateur ou un essai inexistant, alors la page affiche « essai introuvable » dans les deux cas, pour ne pas révéler qu'il existe.
- **CA6.6** Étant donné une adresse de comparaison qui vise deux essais de katas différents, alors la comparaison est refusée avec un message.

## 5. Exigences de sécurité (tests automatiques)

- **S1** Un visiteur anonyme lit les katas. Il ne lit ni n'écrit d'essais, de clés ou de profils.
- **S2** L'utilisateur A lit et crée ses propres essais. Il ne lit ni ne modifie ceux de B, et ne peut pas créer d'essai au nom de B.
- **S3** Aucun client, pas même le propriétaire, ne lit ni n'écrit la collection des clés. Seul le serveur y accède.
- **S4** Aucun client ne crée, ne modifie ni ne supprime de kata.
- **S5** Une fois son résultat enregistré, un essai n'est plus modifiable par aucun client.
- **S6** Toute route serveur vérifie le jeton d'identité. Sans jeton valide, elle répond 401.
- **S7** Le serveur n'appelle que les adresses de la liste fermée des fournisseurs.
- **S8** La clé en clair n'existe que dans la mémoire du serveur, le temps de l'appel au fournisseur.

## 6. Exigences de CI et de déploiement

- **N1** Étant donné un fichier à 6 fonctions, un dossier à 6 fichiers ou un quatrième niveau de sous-dossier, quand la CI s'exécute, alors elle échoue, et son message indique le fichier et la limite en cause.
- **N2** Étant donné une fusion sur `main` avec une CI verte, alors le front, les routes serveur, les règles et les index Firestore se déploient automatiquement.
- **N3** Étant donné un secret présent dans un commit, quand la CI s'exécute, alors elle échoue.
- **N4** Étant donné une CI rouge, alors rien n'est déployé.

## 7. Traçabilité vers les critères de réussite

| Critère (`intent.md`) | Couvert par |
|---|---|
| R1 : 3 katas jouables | US3, US4 |
| R2 : 2 essais comparés | US5, US6 |
| R3 : clé jamais renvoyée | US2, S3, S8 |
| R4 : isolation des données | S1 à S5 |
| R5 : CI verte et limites de structure | N1, N3 |
| R6 : déploiement automatique | N2, N4 |
| R7 : temps relevé | `docs/retro.md` |
