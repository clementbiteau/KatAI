# KatAI : intention et priorisation

Statut : étape 1, version 4, validée le 2026-10-16 ; amendée le 2026-10-19 (ajout du mode Randori, élément 12 ; recadrage des katas par étape du cycle de développement, élément 13) ; amendée le 2026-10-20 (OpenAI passe en Could). Date : 2026-10-16.

## 1. Objectif

Offrir un dojo où l'on s'entraîne à écrire des spécifications qu'un modèle IA transforme en code. Les tests du kata donnent un retour objectif, et la comparaison des essais rend le progrès visible.

## 2. Pourquoi

- Travailler avec des agents est une compétence en soi : formuler l'intention, cadrer, découper, anticiper les cas limites. Elle progresse par la pratique délibérée, comme le code progresse par les katas.
- Les plateformes de katas classiques entraînent à écrire le code soi-même, pas à le déléguer.
- Sans mesure, on ne sait pas si une spécification est meilleure qu'une autre. Exécuter des tests et comparer les essais apporte cette mesure.

## 3. Utilisateurs

| Profil | Besoin | Tranche |
|---|---|---|
| Développeur qui s'entraîne seul (premier utilisateur : le porteur du projet) | Pratiquer, mesurer, comparer ses essais | T1 |
| Product builder | Apprendre à spécifier pour un modèle sans écrire le code | T1 (même parcours) |
| Équipe | Partager configuration, contexte et assets | T3 |

## 4. Parcours cœur (tranche 1)

1. Je me connecte.
2. J'enregistre ma clé API Anthropic (OpenAI passe en Could le 2026-10-20). Elle est chiffrée côté serveur et ne m'est plus jamais renvoyée.
3. Je choisis un kata : un énoncé et la signature de la fonction attendue. Les tests ne sont pas affichés.
4. J'écris ma spécification.
5. Le serveur appelle mon modèle avec ma spécification, et le modèle renvoie du code.
6. Le code s'exécute contre les tests du kata dans un environnement isolé, et j'obtiens un score.
7. L'essai est enregistré, et je compare deux essais côte à côte.

## 5. Critères de réussite (tranche 1)

| # | Critère | Vérification |
|---|---|---|
| R1 | 3 katas jouables de bout en bout sur la version déployée | Parcours manuel consigné dans `docs/retro.md` |
| R2 | 2 essais d'un même kata comparés côte à côte : spécification, code, tests réussis sur total, modèle, durée, tokens | Test automatique de la comparaison et parcours manuel |
| R3 | Une fois saisie, la clé n'est plus jamais renvoyée : aucune réponse d'API, aucune page et aucun journal ne la contient | Tests automatiques : les règles de sécurité refusent toute lecture client de la collection des clés, et la route serveur ne renvoie qu'un indicateur « configurée » |
| R4 | Un utilisateur ne lit ni ne modifie les essais ou les clés d'un autre ; un visiteur anonyme ne lit que les katas | Tests des règles de sécurité sur l'émulateur Firebase, automatiques en CI |
| R5 | La CI est verte sur `main` (tests, contrôle de structure, tests des règles), et un dépassement de limite fait échouer le build | CI, plus un test du script de contrôle sur un cas en échec |
| R6 | Le déploiement depuis `main` est automatique (front, routes serveur, règles et index Firestore) | Exécution réussie du pipeline de déploiement |
| R7 | Le temps passé est relevé par étape, sans plafond | Tableau des temps dans `docs/retro.md`, tiré de l'historique git |
| R8 | Un randori se joue de bout en bout, avec un chronomètre tenu par le serveur | Tests automatiques sur l'échéance, plus un parcours manuel |

La saisie initiale de la clé passe forcément par le navigateur. R3 porte sur tout ce qui suit cette saisie.

## 6. Contraintes

- **Temps** : ni plafond ni horizon. La qualité prime (amendé le 2026-10-19). Le porteur du projet décide quand s'arrêter, et la tranche 1 reste fine.
- **Comptes** : GitHub (dépôt public), Firebase (offre gratuite), et Vercel ou Streamlit pour l'hébergement (choix en étape 3). Aucun service payant en tranche 1.
  - **Firebase** remplace Supabase, car l'offre gratuite de Supabase n'a plus d'emplacement disponible. On utilise Firebase Authentication, Cloud Firestore et les règles de sécurité Firestore. Les règles s'appliquent par document, l'équivalent des règles par ligne.
  - **Logique serveur** : elle tourne dans les routes serveur de l'hébergeur, avec le SDK Admin de Firebase, et non dans Cloud Functions. Hypothèse à vérifier en étape 3 : Cloud Functions exige l'offre payante.
  - **Vercel** : l'import exige un dépôt GitHub non vide. Le premier push se fera avec un squelette déployable, en première tâche de l'étape 6, et seulement sur ton accord.
- **Prérequis locaux** :
  - l'émulateur Firebase a besoin de Java, absent sur la machine (version minimale à vérifier) ;
  - son installation est proposée en étape 5, sur ton accord ;
  - la CLI Firebase 15.9.1, Node 26 et Docker sont présents.
- **Stack** : libre, choisie en étape 3.
- **Fournisseurs LLM** : Anthropic en tranche 1, avec la clé API de l'utilisateur. OpenAI passe en Could (décision du porteur du projet, 2026-10-20).
- **Qualité du code**, contrôlée en CI :
  - au plus 5 fonctions par fichier, 5 fichiers par dossier et 3 niveaux de sous-dossiers ;
  - une fonction, c'est toute définition de fonction dans le code (voir Q5 pour les fonctions anonymes) ;
  - pas de migrations SQL avec Firestore. En contrepartie, chaque changement du modèle de données ou des règles de sécurité est documenté dans le dépôt : objet, collections touchées, effet sur les règles, retour arrière ;
  - toute exception imposée par un framework sera proposée en étape 3 et validée avant application.
- **Sécurité** :
  - aucun secret dans le dépôt ;
  - les clés utilisateurs sont chiffrées et ne quittent jamais le serveur ;
  - les appels LLM partent uniquement du serveur, vers une liste fermée d'adresses.
- **Fonctionnement** :
  - aucun push ni déploiement sans accord explicite ;
  - dépôt personnel et neutre ;
  - katas originaux, écrits pour le projet.

## 7. Risques

| Risque | Parade envisagée (détaillée en ADR) |
|---|---|
| Injection de prompt : l'énoncé ou la spécification pousse le modèle à produire du code malveillant (lecture de la session, appels réseau). Le risque grandit en T3 avec les assets partagés par des tiers | Exécution isolée, sans accès à la session ni au stockage, avec un délai maximal ; aucun secret côté client |
| Appels vers des adresses arbitraires | Adresses des fournisseurs fixées côté serveur ; aucune adresse fournie par l'utilisateur |
| Fuite de clé | Chiffrement au repos avec une clé maîtresse gardée en secret serveur ; jamais en clair en base, dans les journaux ou dans les réponses ; règles de sécurité testées |
| Le SDK Admin contourne les règles de sécurité : une erreur côté serveur n'est rattrapée par aucune règle | Accès Admin cantonné à un seul module serveur, vérification explicite de l'identité à chaque route, tests dédiés |
| Coût pour l'utilisateur, qui paie avec sa clé | Plafond de tokens par appel, limite d'essais par minute, modèle choisi explicitement |
| Quotas des offres gratuites (Firebase, GitHub, hébergeur) | À vérifier en étape 3 ; suivi en T2 grâce à l'observabilité |
| Dépôt public : les tests des katas sont lisibles par tous | Acceptable en T1, puisque tricher ne nuit qu'à soi-même. En T2, les tests réellement cachés devront vivre hors du dépôt public |
| Dépôt public : un secret commité par erreur est exposé immédiatement | Détection de secrets en CI et dans un hook avant commit (étape 5) ; rotation immédiate en cas de fuite |
| Code généré qui boucle ou sature le navigateur | Délai maximal et arrêt forcé de l'exécution |
| Score falsifiable, puisque les tests tournent dans le navigateur | Acceptable tant qu'il n'y a ni classement, ni succès, ni publication ; bac à sable serveur prévu en T2 |
| Durée maximale d'une route serveur de l'hébergeur plus courte que la réponse d'un modèle | Limite à vérifier en étape 3 ; plafond de tokens |
| Tranche 1 qui grossit au-delà du week-end | Tranche fine, ligne de coupe (section 9), signalement de tout glissement dès qu'il apparaît |
| Limites de structure incompatibles avec un framework | Exceptions explicites proposées en étape 3, jamais de contournement silencieux |

## 8. Priorisation MoSCoW

| # | Élément | MoSCoW | Justification | Tranche |
|---|---|---|---|---|
| 1 | Authentification | Must | Sans identité, pas de clé personnelle ni d'essais à soi | T1 |
| 2 | Base de données (Firebase, à la place de Supabase) et règles de sécurité testées | Must | Toutes les données sont personnelles ; des règles non testées sont la première source de fuite | T1 |
| 3 | LLM apporté par l'utilisateur | Must | C'est le cœur du kata. Appel en une passe, liste fermée de modèles. Anthropic en T1 ; OpenAI passe en Could le 2026-10-20 | T1 |
| 4 | Bac à sable | Must | Sans exécution, pas de score objectif (option A). Version 1 dans le navigateur, version 2 côté serveur | T1, puis T2 |
| 8 | Enregistrement et comparaison des essais | Must | C'est un critère de réussite et ce qui rend le progrès visible | T1 |
| 11 | README soigné | Must | Le produit est fait pour être utilisé et repris. Version minimale en T1 (installer, lancer, sécurité), version soignée en T2 | T1, puis T2 |
| 6 | Observabilité | Should | Indispensable dès qu'il y a plusieurs utilisateurs et des coûts. Durée, tokens et erreur sont stockés avec chaque essai dès T1, car ils servent la comparaison ; le tableau de bord vient en T2 | T2 |
| 7 | Compte démo | Should | Permet d'essayer sans clé. Sans clé plateforme, la démo rejoue des essais enregistrés | T2 |
| 10 | Publication et partage d'assets | Should | Crée l'effet communauté, mais introduit du contenu tiers (injection de prompt), de la modération et des règles de lecture publique | T3 |
| 9 | Succès | Could | Motivant, mais suppose un score fiable, donc le bac à sable serveur | T3 |
| 12 | Randori : kata contre la montre | Should | Entraîne à spécifier vite et juste. Le coût reste modéré, car il réutilise la boucle d'essai. Le chronomètre est tenu par le serveur | T1, en fin de construction |
| 13 | Katas par étape du cycle de développement, à partir de briefs clients réalistes (section 8 bis) | Must pour les spec katas ; Should pour les guardrail et review katas ; Could pour les framing katas | Le dojo entraîne le cycle de développement avec agents, pas l'algorithmique. Des besoins crédibles de grands comptes et d'ETI favorisent l'adoption | T1, T2, T3 |
| 5 | Équipes | Could | Utile pour les équipes, mais complique fortement le modèle de sécurité (règles par équipe) ; inutile tant que l'usage reste individuel | T3 |

### 8 bis. Types de katas (amendement du 2026-10-19)

Un kata part d'un brief client réaliste et entraîne une étape du cycle de développement avec agents. Les entreprises des briefs sont fictives et les secteurs génériques. Le dépôt ne nomme aucun client ni aucun cabinet réel (règle de neutralité).

| Étape du cycle | Type de kata | Ce que l'utilisateur produit avec son agent | Notation | Tranche |
|---|---|---|---|---|
| Spécification | Spec kata | Une spécification, à partir d'un brief client | Le modèle code à partir de la spécification, puis les tests d'acceptation cachés jugent | T1 |
| Garde-fous | Guardrail kata | La suite de tests d'une fonctionnalité | Les tests doivent valider l'implémentation correcte et attraper des versions volontairement boguées | T2 |
| Revue | Review kata | La relecture d'un code produit par un agent, face à la spécification | Retrouver les écarts volontairement introduits | T2 |
| Cadrage, conception, plan | Framing kata | Une intention, un ADR ou un plan, à partir d'un brief | Grille d'évaluation appliquée par un modèle juge, sur la clé de l'utilisateur | T3 |

Le Randori enchaînera plusieurs étapes sur un même brief, contre la montre, dès que plusieurs types de katas existeront. En T1, il porte sur les spec katas.

Secteurs des 3 premiers briefs : retail (facile), luxe (moyen), banque (difficile).

**Won't**, pour ces trois tranches :
- Connexion par abonnement (compte ChatGPT ou Claude.ai) au lieu d'une clé API. Il faudrait gérer des jetons OAuth, et les conditions des fournisseurs encadrent cet usage par des applications tierces (à vérifier en étape 3).
- Adresse de modèle libre et modèles locaux.
- Classement public et paiement.

## 9. Tranches

### Tranche 1 : boucle jouable (ce week-end)

- Authentification Firebase (méthode choisie en étape 3).
- Modèle de données minimal (katas, clés, essais), règles de sécurité et leurs tests sur l'émulateur.
- Clé Anthropic chiffrée ; appel en une passe depuis une route serveur. OpenAI passe en Could (2026-10-20).
- 3 spec katas originaux (retail, luxe, banque), rédigés comme des briefs clients, résolus en JavaScript et exécutés dans le navigateur de façon isolée, avec un délai maximal. Chaque kata affiche son étape du cycle et la compétence qu'il entraîne.
- Essais enregistrés (spécification, code, résultat, modèle, durée, tokens, erreur).
- Comparaison de deux essais en deux colonnes. La mise en évidence des différences passe en T2, pour garder la tranche fine.
- Deux sections : Kata (entraînement libre) et Randori (contre la montre, chronomètre tenu par le serveur).
- CI (tests, contrôle de structure, règles de sécurité) et déploiement automatique.
- README minimal.

**Ligne de coupe**, appliquée dans cet ordre si la tranche déborde du week-end :
1. Le Randori passe en ouverture de T2.
2. Un seul fournisseur ; le second arrive en ouverture de T2.
3. Déploiement manuel documenté à la place du déploiement automatique.

La CI n'est jamais coupée.

### Tranche 2 : produit fiable, ouvert à d'autres

- Bac à sable serveur : score non falsifiable et tests réellement cachés. Il demandera probablement un service supplémentaire, à décider.
- Observabilité : consommation, latence et erreurs par utilisateur et par fournisseur.
- Compte démo avec essais prêts.
- Mise en évidence des différences entre deux essais.
- Quotas par utilisateur.
- README soigné, guide d'ajout de kata, nouveaux katas.
- Revue IA des pull requests en CI, si Q3 est confirmée.
- Guardrail katas et review katas (section 8 bis), qui réutilisent le bac à sable.

### Tranche 3 : communauté

- Publication de travaux et partage d'assets (prompts, architecture, specs).
- Succès.
- Équipes.
- Mode agent multi-tours, si Q1 est confirmée.
- Fournisseur OpenAI (Could, décision du 2026-10-20). Les vérifications déjà faites sont consignées dans l'ADR 0005.
- Framing katas (cadrage, conception, plan) notés par un modèle juge (section 8 bis).
- Randori enchaînant plusieurs étapes du cycle sur un même brief.

## 10. Questions

### Réponses reçues

- **Q2. Dépôt** : public pour commencer.
- **Q6. Temps** : aucun plafond ; le porteur du projet décide quand s'arrêter.
- **Q8. Base de données** : Firebase à la place de Supabase.
- **Hébergement** : Vercel ou Streamlit sont disponibles. Le choix se fait en étape 3.

### Questions restantes (hypothèses appliquées sauf correction)

- **Q1. « Connecter OpenAI Codex et Claude Code »**
  - Hypothèse retenue : l'utilisateur fournit une clé API OpenAI ou Anthropic, et le serveur appelle le modèle en une passe, sans boucle d'agent.
  - Faire tourner les agents eux-mêmes (boucle multi-tours avec outils, fichiers et retour des tests) demande un bac à sable serveur, d'où la proposition en T3.
- **Q3. « CI/CD agentique »**
  - Hypothèse : le pipeline est construit et opéré par l'agent, et le déploiement part automatiquement de `main` après ton accord de fusion.
  - Une revue IA des pull requests demanderait une clé API en secret GitHub, d'où la proposition en T2.
- **Q4. Langage des katas**
  - Hypothèse : JavaScript/TypeScript, le seul langage simple à exécuter dans le navigateur en T1.
  - D'autres langages viendront avec le bac à sable serveur.
- **Q5. Fonctions anonymes passées en argument** (callbacks de test, `map`, gestionnaires d'événements)
  - Si elles comptent, un fichier de test est limité à 4 cas plus le `describe`, ce qui force un découpage artificiel.
  - Proposition : toute fonction nommée ou assignée à une variable ou à une propriété compte ; une fonction anonyme passée directement en argument ne compte pas.
- **Q7. Licence du dépôt public**
  - Sans licence, le code reste « tous droits réservés » : il est lisible, mais ni réutilisable ni ouvert aux contributions.
  - Hypothèse : MIT, à confirmer en étape 5.
