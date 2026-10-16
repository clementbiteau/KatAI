# KatAI : intention et priorisation

Statut : étape 1, à valider. Date : 2026-10-16.

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
2. J'enregistre ma clé API OpenAI ou Anthropic. Elle est chiffrée côté serveur et ne m'est plus jamais renvoyée.
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
| R3 | Une fois saisie, la clé n'est plus jamais renvoyée : aucune réponse d'API, aucune page et aucun journal ne la contient | Tests automatiques : la RLS refuse la lecture directe de la table, et la fonction serveur ne renvoie qu'un indicateur « configurée » |
| R4 | Un utilisateur ne lit ni ne modifie les essais ou les clés d'un autre ; un visiteur anonyme ne lit que les katas | Tests RLS automatiques en CI |
| R5 | La CI est verte sur `main` (tests, contrôle de structure, tests RLS), et un dépassement de limite fait échouer le build | CI, plus un test du script de contrôle sur un cas en échec |
| R6 | Le déploiement depuis `main` est automatique (front, migrations, fonctions serveur) | Exécution réussie du pipeline de déploiement |
| R7 | La tranche 1 tient en 7 h de travail maximum | Temps relevé dans `docs/retro.md` |

La saisie initiale de la clé passe forcément par le navigateur. R3 porte sur tout ce qui suit cette saisie.

## 6. Contraintes

- **Temps** : 5 à 7 h pour la tranche 1. Hypothèse : ce budget couvre toute la chaîne, étapes 1 à 7 (voir Q6).
- **Comptes** : GitHub et Supabase personnels uniquement. Aucun autre compte ni service payant en tranche 1.
- **Stack** : libre, choisie en étape 3.
- **Fournisseurs LLM** : OpenAI et Anthropic, avec la clé API de l'utilisateur.
- **Qualité du code**, contrôlée en CI :
  - au plus 5 fonctions par fichier, 5 fichiers par dossier et 3 niveaux de sous-dossiers ;
  - une fonction, c'est toute définition de fonction dans le code (voir Q5 pour les fonctions anonymes) ;
  - exception : `supabase/migrations/` n'est pas soumis à la limite de 5 fichiers. En contrepartie, chaque migration porte un en-tête documenté : objet, tables touchées, effet sur la RLS, retour arrière ;
  - toute autre exception imposée par un framework sera proposée en étape 3 et validée avant application.
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
| Fuite de clé | Chiffrement au repos avec une clé maîtresse gardée en secret serveur ; jamais en clair en base, dans les journaux ou dans les réponses ; RLS testée |
| Coût pour l'utilisateur, qui paie avec sa clé | Plafond de tokens par appel, limite d'essais par minute, modèle choisi explicitement |
| Quotas des offres gratuites Supabase et GitHub | À vérifier en étape 3 ; suivi en T2 grâce à l'observabilité |
| Code généré qui boucle ou sature le navigateur | Délai maximal et arrêt forcé de l'exécution |
| Score falsifiable, puisque les tests tournent dans le navigateur | Acceptable tant qu'il n'y a ni classement, ni succès, ni publication ; bac à sable serveur prévu en T2 |
| Durée maximale d'une fonction serveur plus courte que la réponse d'un modèle | Limite à vérifier en étape 3 ; plafond de tokens |
| Budget de 5 à 7 h dépassé | Ligne de coupe (section 9), et signalement de tout glissement dès qu'il apparaît |
| Limites de structure incompatibles avec un framework | Exceptions explicites proposées en étape 3, jamais de contournement silencieux |

## 8. Priorisation MoSCoW

| # | Élément | MoSCoW | Justification | Tranche |
|---|---|---|---|---|
| 1 | Authentification | Must | Sans identité, pas de clé personnelle ni d'essais à soi | T1 |
| 2 | Supabase + RLS testées | Must | Toutes les données sont personnelles ; une RLS non testée est la première source de fuite | T1 |
| 3 | LLM apporté par l'utilisateur | Must | C'est le cœur du kata. Liste fermée OpenAI et Anthropic, appel en une passe | T1 |
| 4 | Bac à sable | Must | Sans exécution, pas de score objectif (option A). Version 1 dans le navigateur, version 2 côté serveur | T1, puis T2 |
| 8 | Enregistrement et comparaison des essais | Must | C'est un critère de réussite et ce qui rend le progrès visible | T1 |
| 11 | README soigné | Must | Le produit est fait pour être utilisé et repris. Version minimale en T1 (installer, lancer, sécurité), version soignée en T2 | T1, puis T2 |
| 6 | Observabilité | Should | Indispensable dès qu'il y a plusieurs utilisateurs et des coûts. Durée, tokens et erreur sont stockés avec chaque essai dès T1, car ils servent la comparaison ; le tableau de bord vient en T2 | T2 |
| 7 | Compte démo | Should | Permet d'essayer sans clé. Sans clé plateforme, la démo rejoue des essais enregistrés | T2 |
| 10 | Publication et partage d'assets | Should | Crée l'effet communauté, mais introduit du contenu tiers (injection de prompt), de la modération et des règles RLS publiques | T3 |
| 9 | Succès | Could | Motivant, mais suppose un score fiable, donc le bac à sable serveur | T3 |
| 5 | Équipes | Could | Utile pour les équipes, mais complique fortement le modèle de sécurité (RLS par équipe) ; inutile tant que l'usage reste individuel | T3 |

**Won't**, pour ces trois tranches :
- Connexion par abonnement (compte ChatGPT ou Claude.ai) au lieu d'une clé API. Il faudrait gérer des jetons OAuth, et les conditions des fournisseurs encadrent cet usage par des applications tierces (à vérifier en étape 3).
- Adresse de modèle libre et modèles locaux.
- Classement public et paiement.

## 9. Tranches

### Tranche 1 : boucle jouable (ce week-end, 5 à 7 h)

- Authentification Supabase (méthode choisie en étape 3).
- Schéma minimal (katas, clés, essais), RLS et tests RLS.
- Clés OpenAI et Anthropic chiffrées ; appel en une passe depuis une fonction serveur.
- 3 katas originaux en JavaScript/TypeScript, exécutés dans le navigateur de façon isolée, avec un délai maximal.
- Essais enregistrés (spécification, code, résultat, modèle, durée, tokens, erreur) et comparaison de deux essais.
- CI (tests, contrôle de structure, RLS) et déploiement automatique.
- README minimal.

**Ligne de coupe**, appliquée dans cet ordre en cas de glissement :
1. Comparaison réduite à deux colonnes, sans mise en évidence des différences.
2. Un seul fournisseur ; le second arrive en ouverture de T2.
3. Déploiement manuel documenté à la place du déploiement automatique.

La CI n'est jamais coupée.

### Tranche 2 : produit fiable, ouvert à d'autres

- Bac à sable serveur : score non falsifiable et tests réellement cachés. Il demandera probablement un service supplémentaire, à décider.
- Observabilité : consommation, latence et erreurs par utilisateur et par fournisseur.
- Compte démo avec essais prêts.
- Quotas par utilisateur.
- README soigné, guide d'ajout de kata, nouveaux katas.
- Revue IA des pull requests en CI, si Q3 est confirmée.

### Tranche 3 : communauté

- Publication de travaux et partage d'assets (prompts, architecture, specs).
- Succès.
- Équipes.
- Mode agent multi-tours, si Q1 est confirmée.

## 10. Questions ouvertes

- **Q1. « Connecter OpenAI Codex et Claude Code »**
  - Hypothèse retenue : l'utilisateur fournit une clé API OpenAI ou Anthropic, et le serveur appelle le modèle en une passe, sans boucle d'agent.
  - Faire tourner les agents eux-mêmes (boucle multi-tours avec outils, fichiers et retour des tests) demande un bac à sable serveur, d'où la proposition en T3.
- **Q2. Dépôt public ou privé ?**
  - La réponse conditionne l'hébergement du front (disponibilité de GitHub Pages sur un dépôt privé selon l'offre, à vérifier) et la visibilité du README.
- **Q3. « CI/CD agentique »**
  - Hypothèse : le pipeline est construit et opéré par l'agent, et le déploiement part automatiquement de `main` après ton accord de fusion.
  - Une revue IA des pull requests demanderait une clé API en secret GitHub, d'où la proposition en T2.
- **Q4. Langage des katas**
  - Hypothèse : JavaScript/TypeScript, le seul langage simple à exécuter dans le navigateur en T1.
  - D'autres langages viendront avec le bac à sable serveur.
- **Q5. Fonctions anonymes passées en argument** (callbacks de test, `map`, gestionnaires d'événements)
  - Si elles comptent, un fichier de test est limité à 4 cas plus le `describe`, ce qui force un découpage artificiel.
  - Proposition : toute fonction nommée ou assignée à une variable ou à une propriété compte ; une fonction anonyme passée directement en argument ne compte pas.
- **Q6. Budget de 5 à 7 h**
  - Couvre-t-il toute la chaîne (étapes 1 à 7) ou seulement la construction ?
