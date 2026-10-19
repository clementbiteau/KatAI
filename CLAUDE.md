# CLAUDE.md : règles de travail sur KatAI

KatAI est un dojo d'entraînement à la spécification pour le développement avec des agents IA : l'utilisateur écrit une spécification, son modèle génère le code, et les tests du kata le notent. Référence : `docs/intent.md`, `docs/spec.md`, `docs/adr/`, `docs/plan.md`.

## Démarche

- La chaîne compte 7 étapes : intention, spec, ADR, plan, garde-fous, construction, rétro. On s'arrête à la fin de chaque étape, et l'on attend un « OK » explicite du porteur du projet.
- Pendant la construction, on avance une tâche du plan à la fois : tests d'abord, code minimal, tests exécutés, petit commit au message clair, puis présentation des résultats.
- La qualité prime : il n'y a pas de plafond de temps. Une estimation dépassée se signale et la tâche se découpe, mais la qualité ne se coupe jamais.
- Hypothèses et incertitudes se signalent. On n'invente ni version, ni API, ni chiffre : on vérifie, ou on dit que c'est à vérifier.
- Toute décision d'architecture nouvelle ou modifiée passe par un ADR (nouveau ou amendé et daté).

## Langues

- Code, identifiants, interface et katas : en anglais.
- Documents de démarche (`docs/`, ce fichier, messages de commit) : en français.
- Pas d'emoji.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement Next.js |
| `npm run build` | Build de production |
| `npm run lint` | ESLint, zéro avertissement toléré |
| `npm run typecheck` | Vérification des types TypeScript |
| `npm test` | Tests unitaires et de composants (Vitest, projet `unit`) |
| `npm run test:emulator` | Tests des règles Firestore et des routes serveur sur les émulateurs Firebase (Java 21 requis) |
| `npm run check:structure` | Contrôle des limites de structure (ADR 0009) |

Java 21 est installé par Homebrew, sans lien système. Avant les tests sur émulateur : `export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"`.

Le hook avant commit (`.githooks/pre-commit`, activé par `npm install`) bloque les secrets (gitleaks) et les violations de structure. Ne jamais le contourner (`--no-verify` interdit).

## Standard de structure (contrôlé en CI, un dépassement fait échouer le build)

- Au plus 5 fonctions par fichier. Les fonctions anonymes passées directement en argument ou en attribut JSX ne comptent pas.
- Au plus 5 fichiers par dossier ; les sous-dossiers ne comptent pas.
- Au plus 3 niveaux de sous-dossiers.
- `docs/` est exclu ; les fichiers de configuration de la racine sont listés nominativement dans `scripts/structure/config.ts`.
- Une fonction a une responsabilité ; les noms sont explicites ; aucun code mort.
- Si une limite impose un découpage artificiel, on le signale avant de la contourner, et toute exception passe par un amendement de l'ADR 0009.

## Arborescence

- `app/` : pages et routes Next.js. Pas de `src/`, routes plates, pas de segments dynamiques imbriqués.
- `scripts/` : outillage (contrôle de structure).
- `tests/` : arborescence parallèle au code. `tests/emulator/` est réservé aux tests qui demandent les émulateurs.
- `docs/` : intention, spec, ADR, plan, rétro.

## Interdits de sécurité

- Aucun secret dans le dépôt, le chat ou les journaux. Les secrets se saisissent dans Vercel ou GitHub, par le porteur du projet.
- Ne jamais définir `ANTHROPIC_API_KEY` ni `OPENAI_API_KEY` côté serveur. On utilise uniquement la clé enregistrée par chaque utilisateur.
- Les clés utilisateurs sont chiffrées (ADR 0004), jamais renvoyées au client, jamais journalisées.
- Les adresses des fournisseurs sont fixées en dur (`baseURL` explicite), jamais tirées d'une entrée ni de l'environnement. Aucune nouvelle tentative automatique.
- Le client lit, le serveur écrit (ADR 0003). Chaque route vérifie le jeton Firebase, et le `uid` ne vient jamais du corps de la requête.
- Le code généré par un modèle s'exécute uniquement dans le bac à sable (ADR 0006). Il s'affiche en texte, jamais en HTML (`dangerouslySetInnerHTML` interdit).
- Aucun push, aucune fusion, aucun déploiement sans accord explicite du porteur du projet.
- On ne lit, ne modifie et ne pousse rien en dehors de ce dépôt.
