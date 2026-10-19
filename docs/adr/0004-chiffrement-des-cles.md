# ADR 0004 : chiffrement des clés utilisateurs

Statut : proposé, 2026-10-19.

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
