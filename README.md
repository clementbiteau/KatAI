# KatAI

A coding dojo for working with AI agents. You practice writing **specifications**: your own model turns your spec into code, and the kata's tests score the result. Compare your attempts, and race the clock in Randori mode.

> Status: early development (tranche 1). Not usable yet.

## How it works

1. Pick a kata and read its statement.
2. Write a spec for your model. The model only sees your spec and the expected function signature, never the statement or the tests.
3. Your model (Anthropic Claude, with your own API key) generates the code. More providers may come later.
4. The code runs against the kata's tests in an isolated browser sandbox.
5. Compare attempts side by side, or race the clock in Randori mode.

## Development

Requirements: Node.js 24 or later, Java 21 (Firebase emulators), gitleaks (pre-commit hook).

```bash
npm install
npm run dev
```

Quality gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:emulator`, `npm run check:structure`.

## Project documents

Design and decisions are documented in French in [`docs/`](docs/): intent, specification, architecture decision records, plan.

## License

[MIT](LICENSE)
