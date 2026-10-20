# ADR 0004 : chiffrement des clés utilisateurs

Statut : accepté le 2026-10-19.

## Contexte

Les clés OpenAI et Anthropic des utilisateurs sont chiffrées au repos. Elles ne sont déchiffrées que côté serveur, le temps d'un appel, et ne sont jamais renvoyées au client (R3, CA2.1 à CA2.7, S3, S8). Aucun service payant n'est autorisé en T1.

## Options

| Option | Statut |
|---|---|
| A. AES-256-GCM avec `node:crypto`, clé maîtresse en variable d'environnement serveur | Retenue |
| B. Google Cloud KMS | Écartée : demande un compte de facturation |
| C. libsodium (boîte scellée) | Écartée : dépendance en plus, sans gain ici |
| D. Pas de chiffrement, protection par les seules règles | Écartée : contraire à l'intention |

## Choix

A : AES-256-GCM avec `node:crypto`.

## Détails

- La clé maîtresse fait 32 octets, encodée en base64, dans `KEY_ENCRYPTION_KEY`. C'est une variable sensible côté Vercel, jamais dans le dépôt, générée par toi sur ta machine.
- Un IV aléatoire de 12 octets est tiré à chaque chiffrement. On stocke `ciphertext`, `iv` et `authTag`.
- Les données authentifiées associées valent `"{uid}:{provider}"`. Un chiffré déplacé vers un autre utilisateur ou un autre fournisseur ne se déchiffre pas.
- `keyVersion` prépare la rotation. Pendant une rotation, l'ancienne clé maîtresse reste lisible via `KEY_ENCRYPTION_KEY_PREVIOUS`, et chaque clé est rechiffrée à son prochain usage.
- Le déchiffrement n'a lieu que dans la route d'appel au modèle. La valeur en clair reste une variable locale : jamais journalisée ni renvoyée.
- `GET /api/keys` renvoie seulement `{ provider, configured, updatedAt }` (CA2.2).
- À l'enregistrement, seule la forme est contrôlée : 20 à 300 caractères, sans espace (CA2.5). Aucun appel de test n'est fait au fournisseur.

## Conséquences

- La clé maîtresse et une copie de la base suffiraient à déchiffrer toutes les clés. Parades :
  - variable d'environnement restreinte ;
  - procédure de rotation documentée dans le README ;
  - l'interface conseille d'utiliser une clé dédiée à KatAI, avec un plafond de dépense chez le fournisseur.
- Tests : aller-retour chiffrement puis déchiffrement, échec avec d'autres données associées, échec avec un chiffré altéré.

## Amendement du 2026-10-19 : réalisation (T11)

- **Versions des clés maîtresses.** La version courante est donnée par `KEY_ENCRYPTION_KEY_VERSION` (1 par défaut). Chaque clé chiffrée enregistre sa version.
- **Rotation, sans interruption de service :**
  1. ajouter `KEY_ENCRYPTION_KEY_PREVIOUS` (l'ancienne clé maîtresse) ;
  2. remplacer `KEY_ENCRYPTION_KEY` par une nouvelle clé générée avec `openssl rand -base64 32` ;
  3. incrémenter `KEY_ENCRYPTION_KEY_VERSION`.

  Les clés de version précédente restent déchiffrables. Le rechiffrement au prochain usage se fera lors de l'appel au modèle (T14).
- **Déchiffrement.** La fonction existe dès T11 pour être testée avec le chiffrement, et sert en T14.
- **Routes.** `POST /api/keys` contrôle la forme de la clé, la chiffre avec les données associées `uid:provider`, l'enregistre et ne renvoie que son statut. `DELETE /api/keys?provider=` supprime le document chiffré. Sans clé maîtresse configurée, la route répond 503, sans rien journaliser.
- **Tests :**
  - en unitaire : aller-retour, IV unique, refus si l'utilisateur, le fournisseur, le chiffré ou l'étiquette change, rotation ;
  - sur les émulateurs : écriture, remplacement, refus des requêtes invalides, 401, suppression, aucun journal contenant la clé, y compris en cas de mauvaise configuration ;
  - de bout en bout dans les 3 navigateurs : aucune réponse de `/api/keys` ne contient jamais la clé (R3).

  Une mutation qui renvoie la clé dans la réponse est détectée.

## Amendement du 2026-10-20 : déchiffrement à l'usage (T14)

- **Durée de vie de la clé en clair.** La clé est déchiffrée uniquement dans la route de soumission, le temps de l'appel au modèle (S8).
- **Rechiffrement.** Si elle a été chiffrée avec l'ancienne clé maîtresse, elle est rechiffrée aussitôt avec la clé courante, et un test le vérifie. Effet de bord accepté : la date « Configured on » affichée devient celle du rechiffrement.
- **Clé illisible.** Si la clé ne peut plus être déchiffrée (chiffré altéré, ancienne clé maîtresse retirée), la route répond 409 `unreadable-key` et invite à l'enregistrer de nouveau. Aucun appel n'est alors fait.
