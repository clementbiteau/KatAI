# ADR 0006 : bac à sable d'exécution dans le navigateur

Statut : proposé, 2026-10-19.

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
