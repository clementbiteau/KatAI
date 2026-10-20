# Mise en production : projet Firebase, Vercel et GitHub (T21)

Guide pas à pas des réglages faits par le porteur du projet. Aucun secret ne passe par ce dépôt ni par le chat : chaque valeur sensible se colle directement dans Vercel ou GitHub. Décisions : ADR 0002 (données), ADR 0003 (sécurité), ADR 0008 (CI/CD).

Rôles vérifiés le 2026-10-20 :
- dans la documentation IAM de Google Cloud ;
- dans le code de `firebase-tools` 15.34.0 : la commande `deploy` exige `firebase.projects.get`, plus les permissions propres à chaque cible.

Le premier passage du job de déploiement confirme le tout. En cas de manque, la CLI nomme la permission absente.

## 1. Projet Firebase

1. Sur console.firebase.google.com, créer le projet `katai`. Désactiver Google Analytics.
2. Noter l'identifiant du projet (par exemple `katai-1a2b3`). C'est un identifiant public.

## 2. Firestore

1. Menu Build, puis Firestore Database, puis Create database.
2. Choisir l'édition Standard et la base `(default)`, celle qui bénéficie du quota gratuit.
3. Région : `europe-west9` (Paris). Ce choix est définitif (ADR 0002).
4. Démarrer en mode production : tout est refusé jusqu'au premier déploiement de nos règles par la CI.

## 3. Authentication

1. Menu Build, puis Authentication, puis Get started. Dans Sign-in method, activer Email/Password, sans le lien par e-mail.
2. Dans Settings, puis Password policy : activer l'application stricte (Require enforcement), longueur minimale 8.
3. Dans Settings, puis User actions : vérifier que Email enumeration protection est cochée. Elle est active par défaut sur les projets récents.

## 4. Application web

1. Dans Project settings, puis General, puis Your apps : ajouter une application Web nommée `katai-web`, sans Firebase Hosting.
2. Garder la page de configuration ouverte. Ses valeurs `apiKey`, `authDomain`, `projectId` et `appId` sont publiques, et servent à l'étape 7.

## 5. Restreindre la clé d'API du navigateur (recommandé)

Dans la console Google Cloud du projet, ouvrir APIs & Services, puis Credentials, puis « Browser key (auto created by Firebase) ».

- **Restrictions d'application, sites web** :
  - `https://katai-three.vercel.app/*` ;
  - `https://<identifiant-du-projet>.firebaseapp.com/*`, car la page de réinitialisation du mot de passe, servie par Firebase, utilise la même clé.
- **Restrictions d'API**, d'après la documentation Firebase sur les clés d'API :
  - Identity Toolkit API ;
  - Token Service API ;
  - Cloud Firestore API ;
  - Cloud Datastore API ;
  - Firebase Management API.

La clé reste publique : ces restrictions limitent seulement son usage par des tiers.

## 6. Comptes de service

Les deux comptes se créent dans la console Google Cloud, sous IAM & Admin, puis Service Accounts.

**A. `katai-runtime`** : utilisé par le serveur sur Vercel (SDK Admin).
- Rôle Cloud Datastore User (`roles/datastore.user`) : lecture et écriture des données Firestore.
- Rôle Firebase Authentication Viewer (`roles/firebaseauth.viewer`) : il donne `firebaseauth.users.get`. Le serveur en a besoin pour vérifier qu'un jeton n'a pas été révoqué (`verifyIdToken` avec `checkRevoked`).

**B. `katai-deploy`** : utilisé par le job GitHub qui déploie les règles et les index.
- Rôle Firebase Rules Admin (`roles/firebaserules.admin`).
- Rôle Cloud Datastore Index Admin (`roles/datastore.indexAdmin`).
- Rôle Service Usage Consumer (`roles/serviceusage.serviceUsageConsumer`) : la CLI vérifie que l'API Firestore est active.
- Un rôle personnalisé « KatAI project reader », qui contient la seule permission `firebase.projects.get`. Aucun rôle prédéfini ne donne cette permission sans donner aussi l'accès à d'autres données. On le crée dans IAM & Admin, puis Roles, puis Create role.

**Clés JSON.** Pour chaque compte, ouvrir Keys, puis Add key, puis Create new key, au format JSON. Si la création de clé est refusée par une règle d'organisation, s'arrêter et me le dire : il faudra passer par la fédération d'identité.

## 7. Vercel (projet `katai`)

Ouvrir Settings, puis Environment Variables. Cocher **Production uniquement** : les aperçus de PR ne doivent jamais toucher aux données réelles.

| Nom | Valeur | Type |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` de l'étape 4 | public |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` | public |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` | public |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` | public |
| `FIREBASE_SERVICE_ACCOUNT` | clé JSON de `katai-runtime`, en base64 | Sensitive |
| `KEY_ENCRYPTION_KEY` | 32 octets aléatoires, en base64 | Sensitive |

Commandes locales, qui ne font jamais apparaître la valeur à l'écran :

```bash
base64 -i ~/Downloads/<fichier-katai-runtime>.json | pbcopy
```

```bash
openssl rand -base64 32 | pbcopy
```

Après chaque commande, coller la valeur dans Vercel.

- **Clé maîtresse.** Garder une copie de `KEY_ENCRYPTION_KEY` dans un gestionnaire de mots de passe. Sans elle, les clés déjà enregistrées deviennent illisibles, et chaque utilisateur doit ressaisir la sienne.
- **Région des fonctions** : dans Settings, puis Functions, puis Function Region, choisir Paris (`cdg1`) si l'offre le permet. Le serveur reste alors près de Firestore.
- **Fichier de clé local** : le supprimer une fois la valeur collée.

```bash
rm ~/Downloads/<fichier-katai-runtime>.json
```

## 8. GitHub

L'environnement `production` est créé par la CI/CD. Il est limité à la branche `main`. Y déposer la clé de `katai-deploy` :

```bash
base64 -i ~/Downloads/<fichier-katai-deploy>.json | gh secret set FIREBASE_DEPLOY_SERVICE_ACCOUNT --env production --repo clementbiteau/KatAI
```

```bash
rm ~/Downloads/<fichier-katai-deploy>.json
```

Enfin, me donner l'identifiant du projet, qui est public : je le range en variable GitHub `FIREBASE_PROJECT_ID`.

## 9. Rotation

- **Clé d'un compte de service** : créer une nouvelle clé, mettre à jour Vercel ou GitHub, redéployer, puis supprimer l'ancienne clé dans la console.
- **Clé maîtresse** : voir ADR 0004 (`KEY_ENCRYPTION_KEY_PREVIOUS` et `KEY_ENCRYPTION_KEY_VERSION`).
