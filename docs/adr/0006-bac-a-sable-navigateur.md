# ADR 0006 : bac à sable d'exécution dans le navigateur

Statut : accepté le 2026-10-19.

## Contexte

Le code généré n'est pas fiable : il peut être bogué ou malveillant, par exemple sous l'effet d'une injection de prompt. Il doit pouvoir s'exécuter contre les tests du kata :
- sans accès à la session, au stockage ni au réseau (CA4.10) ;
- avec un arrêt forcé au bout de 5 s (CA4.9) ;
- avec une erreur de chargement clairement signalée (CA4.8) ;
- sans bloquer la page.

## Options

| Option | Statut |
|---|---|
| A. Iframe `sandbox="allow-scripts"` (origine opaque), qui lance un Web Worker | Retenue |
| B. Web Worker de même origine | Écartée : il accède à IndexedDB, donc au jeton Firebase, et au réseau de l'application |
| C. Exécution dans une route serveur | Écartée : même processus que les secrets. Un bac à sable serveur dédié est prévu en T2 |
| D. Interpréteur isolé compilé en WebAssembly (type QuickJS) dans un worker | Repli si A échoue au prototype : isolation forte, mais une dépendance en plus et une exécution plus lente |

## Choix

A, avec D en repli.

## Détails

- **L'iframe** est créée avec `srcdoc`. Elle contient un petit lanceur et une CSP en balise meta : `default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:`. Sans `connect-src`, le réseau est coupé.
- **Le worker** est construit à partir d'un Blob qui assemble le préambule du lanceur, le code généré et le harnais de test. Aucun `eval` n'est nécessaire. Une erreur de syntaxe remonte par l'événement `error` du worker et donne CA4.8.
- **Les tests sont déclaratifs** : `{ label, args, expected }`, comparés par égalité profonde. Ce sont des données sérialisables, transmises par `postMessage`.
- **Messages** : la page vérifie que `event.source` est bien l'iframe. Le worker renvoie chaque résultat au fil de l'eau.
- **Délai** : au bout de 5 s, la page supprime l'iframe, ce qui arrête le worker. Les tests sans résultat passent en « délai dépassé ». Comme le worker tourne sur son propre fil, la page reste réactive.

## Conséquences et incertitudes

- **À vérifier dans les navigateurs** : la création d'un worker depuis un Blob dans une iframe d'origine opaque, et l'héritage de la CSP par ce worker. La première tâche de construction du bac à sable est donc un prototype, testé dans un vrai navigateur.
- **Tests** : Playwright 1.64.1 avec Chromium en CI, plus une vérification manuelle sous Firefox et Safari en T1.
- **Tests visibles** : ils sont dans le paquet JavaScript du client et dans le dépôt public. C'est accepté en T1 (intention).

## Amendement du 2026-10-19 : résultat du prototype (T7)

Le prototype valide l'option A dans Chromium 156 (Chrome Headless Shell de Playwright 1.64.1).

**Choix d'implémentation**
- **Worker classique.** Il charge le code généré avec `importScripts`, ce qui rattrape une erreur de syntaxe avec son message (CA4.8). Le nom de la fonction attendue est vérifié, puis récupéré, que le code la déclare par `function` ou par `const`. Le prompt (ADR 0005) interdit `import` et `export`, et l'extraction du code (T12) retire un `export` éventuel.
- **Évaluateur partagé.** L'évaluateur des tests (`katas/evaluate.ts`) est une seule fonction autonome, sérialisée dans le worker avec `Function.prototype.toString`. Le même code note donc les katas dans les tests Node et dans le navigateur. Contrainte : cette fonction ne référence rien d'extérieur et évite toute syntaxe qu'un compilateur réécrirait avec un utilitaire importé (spread, classes, async).
- **Script d'amorçage statique.** Le script de l'iframe est statique et ne fait que relayer les messages. Son empreinte pourra être autorisée par la CSP de l'application (T20).
- **Résultats au fil de l'eau.** Les résultats arrivent un par un. Les tests déjà passés restent acquis si un test suivant boucle (CA4.9). Les messages reçus sont vérifiés contre l'ordre et les libellés attendus.

**Tests en vrai navigateur** (mode navigateur de Vitest, piloté par Playwright, job CI `sandbox`)
- Exécution correcte, fonction déclarée par `const`, erreur de syntaxe, fonction absente, boucle infinie arrêtée à l'échéance avec la page toujours réactive, nettoyage de l'iframe.
- Réseau et IndexedDB bloqués. Chaque sonde est d'abord exécutée dans un worker ordinaire, où l'accès réussit : ce test témoin prouve que le blocage vient du bac à sable.
- Tests de mutation : ouvrir le réseau dans la CSP fait échouer le test réseau ; donner à l'iframe la même origine que la page (`allow-same-origin`) fait échouer le test de stockage.

**Restent à vérifier**
- Firefox et Safari, en T8 ou en T22.
- La sérialisation de l'évaluateur une fois compilée par le build de production Next (SWC) : couverte en T8 par un test de bout en bout sur le build de production.
