# Décisions d'architecture (ADR)

Une décision par fichier : contexte, options, choix, raisons, conséquences. Pour changer une décision, on ajoute un nouvel ADR ou on amende l'existant en le datant.

| # | Décision | Statut |
|---|---|---|
| [0001](0001-stack-applicative.md) | Next.js (App Router) et TypeScript, sur Vercel | Proposé |
| [0002](0002-authentification-et-donnees.md) | Firebase Auth et Firestore ; katas versionnés dans le dépôt ; schéma | Proposé |
| [0003](0003-modele-de-securite.md) | Le client lit, le serveur écrit ; règles minimales testées | Proposé |
| [0004](0004-chiffrement-des-cles.md) | AES-256-GCM, clé maîtresse en variable serveur, données associées par utilisateur | Proposé |
| [0005](0005-appels-aux-fournisseurs.md) | SDK officiels, adresse fixe, aucune nouvelle tentative, liste fermée de modèles | Proposé |
| [0006](0006-bac-a-sable-navigateur.md) | Iframe d'origine opaque et Web Worker, CSP sans réseau, délai de 5 s | Proposé |
| [0007](0007-randori-chronometre-serveur.md) | Chronomètre tenu par le serveur, clôture paresseuse | Proposé |
| [0008](0008-ci-cd.md) | GitHub Actions ; intégration Git de Vercel et protection de branche | Proposé |
| [0009](0009-controle-de-structure.md) | Portée et règles du contrôle de structure | Proposé |
