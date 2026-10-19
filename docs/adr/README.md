# Décisions d'architecture (ADR)

Une décision par fichier : contexte, options, choix, raisons, conséquences. Pour changer une décision, on ajoute un nouvel ADR ou on amende l'existant en le datant.

| # | Décision | Statut |
|---|---|---|
| [0001](0001-stack-applicative.md) | Next.js (App Router) et TypeScript, sur Vercel | Accepté |
| [0002](0002-authentification-et-donnees.md) | Firebase Auth et Firestore ; katas versionnés dans le dépôt ; schéma | Accepté |
| [0003](0003-modele-de-securite.md) | Le client lit, le serveur écrit ; règles minimales testées | Accepté |
| [0004](0004-chiffrement-des-cles.md) | AES-256-GCM, clé maîtresse en variable serveur, données associées par utilisateur | Accepté |
| [0005](0005-appels-aux-fournisseurs.md) | SDK officiels, adresse fixe, aucune nouvelle tentative, liste fermée de modèles | Accepté |
| [0006](0006-bac-a-sable-navigateur.md) | Iframe d'origine opaque et Web Worker, CSP sans réseau, délai de 5 s | Accepté |
| [0007](0007-randori-chronometre-serveur.md) | Chronomètre tenu par le serveur, clôture paresseuse | Accepté |
| [0008](0008-ci-cd.md) | GitHub Actions ; intégration Git de Vercel et protection de branche | Accepté |
| [0009](0009-controle-de-structure.md) | Portée et règles du contrôle de structure | Accepté |
