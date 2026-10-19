# ADR 0005 : appels aux fournisseurs de modèles

Statut : proposé, 2026-10-19.

## Contexte

Le serveur appelle le modèle choisi par l'utilisateur avec sa clé, en une passe, sans boucle d'agent (Q1). Exigences :
- H2 : le modèle reçoit seulement la spécification et la signature ;
- liste fermée d'adresses (S7) ;
- pas de nouvelle tentative automatique (CA4.6) ;
- délai de 60 s, limite de 5 essais par minute, plafond de tokens.

## Options

- A. Les SDK officiels : `@anthropic-ai/sdk` 0.135.0 et `openai` 7.39.0 (versions npm du 2026-10-19).
- B. `fetch` direct sur les API.
- C. Une bibliothèque d'agrégation ou un intermédiaire, comme OpenRouter.

## Choix

A : les SDK officiels, un adaptateur par fournisseur, derrière une même interface : `generateCode(provider, model, spec, signature)`, qui renvoie `{ code, servedModel, inputTokens, outputTokens, latencyMs, truncated }` ou une erreur typée.

## Raisons

- Les erreurs sont typées et le SDK est maintenu par le fournisseur. La documentation d'Anthropic recommande d'ailleurs son SDK plutôt que des appels HTTP directs.
- C ajoute un tiers par lequel transitent les clés. Écartée.

## Configuration imposée

- Un client est créé par requête, avec la clé déchiffrée.
- `baseURL` est fixé explicitement à l'adresse officielle. Les variables `ANTHROPIC_BASE_URL` et `OPENAI_BASE_URL` ne peuvent donc pas rediriger les appels (S7).
- `maxRetries: 0` (CA4.6) et `timeout: 60_000` ms. Côté TypeScript, le délai s'exprime en millisecondes.
- `ANTHROPIC_API_KEY` et `OPENAI_API_KEY` ne sont jamais définies sur le serveur. Sans clé explicite, le SDK la chercherait dans l'environnement : ce garde-fou évite de facturer une clé plateforme par erreur. Un test vérifie que la clé est toujours passée explicitement.
- Les routes d'appel déclarent une durée maximale de 90 s. Selon la documentation officielle, l'offre Hobby de Vercel autorise jusqu'à 300 s.

## Modèles (liste fermée en T1)

- **Anthropic** : `claude-opus-5-5` par défaut, `claude-sonnet-5-5`, `claude-haiku-5-5`. Ces identifiants viennent de la référence du SDK Anthropic (cache du 2026-10-06). `claude-fable-5-1` est exclu en T1 : il coûte 2,5 fois plus cher et se comporte différemment côté API.
- **OpenAI** : liste à vérifier sur la documentation officielle lors de la tâche d'implémentation. Candidats relevés dans des sources non officielles : `gpt-6.1-sol`, `gpt-5.3-codex`. L'API utilisée (Responses ou Chat Completions) se confirme à la même occasion.

## Prompt (H2)

- **Consigne système fixe**, en anglais : produire une seule fonction JavaScript nommée `<functionName>`, de signature `<signature>` ; renvoyer exactement un bloc de code JavaScript ; ni import, ni entrée-sortie, une fonction pure.
- **Message utilisateur** : la spécification, entre délimiteurs.
- Ni l'énoncé ni les tests ne sont jamais envoyés.
- **Extraction du code** : on prend le premier bloc JavaScript. Sans bloc, l'essai suit CA4.7. Si la réponse s'arrête sur `max_tokens`, l'essai est marqué `truncated` (CA4.13).

## Réflexion des modèles Anthropic

Sur `claude-opus-5-5`, la réflexion ne peut pas être désactivée, et ses tokens comptent dans `max_tokens`. Le plafond de 4 096 validé dans la spec risque donc de tronquer souvent les réponses.

**Proposition à valider** :
- porter le plafond à 16 000, la valeur par défaut recommandée pour un appel sans streaming ;
- fixer explicitement `output_config.effort: "low"` pour contenir le coût, ce qui suffit à générer une petite fonction.

## Refus du modèle

- `stop_reason: "refusal"` donne la catégorie « refus du modèle ».
- La référence Anthropic recommande d'activer par défaut le repli côté serveur sur les modèles Opus et Sonnet 5.5 : en-tête bêta `server-side-fallback-2026-07-01` et `fallbacks: "default"`. Je l'active, et `servedModel` enregistre le modèle qui a réellement répondu, pour que la comparaison reste honnête. À désactiver si tu préfères.

## Correspondance des erreurs (complète CA4.5 et CA4.6)

| Cas | Catégorie |
|---|---|
| 401, 403 | Clé refusée |
| 402 | Crédit insuffisant chez le fournisseur |
| 404 | Modèle indisponible |
| 429 | Limite du fournisseur |
| 500 ou plus (dont 529, surcharge) | Fournisseur indisponible |
| Délai dépassé | Délai dépassé |
| Erreur réseau | Fournisseur injoignable |
| 400 | Requête refusée |
| `refusal` | Refus du modèle |

## Limite d'essais

Avant chaque appel, une transaction sur `usage/{uid}` :
1. retire les horodatages de plus de 60 s ;
2. si 5 restent, répond 429 avec le délai d'attente (CA4.11) ;
3. sinon, ajoute l'heure de la requête.

## Conséquences et risques

- **Injection de prompt** : la spécification vient de l'utilisateur lui-même. La sortie du modèle est traitée comme du code non fiable : bac à sable (ADR 0006), affichage en texte seul. Le point sera à revoir en T3, avec les assets partagés.
- **Coûts** : ils sont à la charge de l'utilisateur. Plafond de tokens, limite d'essais et affichage des tokens consommés. Aucun coût de modèle pour la plateforme.
