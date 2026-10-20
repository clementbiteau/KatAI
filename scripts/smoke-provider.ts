// Manual smoke test against a real provider, run by the project owner outside CI
// (plan T12, T13). The key comes from KATAI_SMOKE_KEY only and is never printed.
// The generated code is printed, never executed: it only ever runs in the browser sandbox.
//
//   read -s KATAI_SMOKE_KEY && export KATAI_SMOKE_KEY
//   npm run smoke:provider -- anthropic claude-haiku-5-5
import { findKata } from "../katas/catalog.ts";
import { validateProviderKey } from "../lib/providers.ts";
import { generateWithAnthropic } from "../lib/server/providers/anthropic.ts";

const SPEC = `Return the total price of a shopping cart, in integer cents.
- Combine lines with the same sku before any offer (same sku means same unit price).
- For each sku, every third unit is free: pay quantity minus floor(quantity / 3) units.
- If the total after that offer is strictly greater than 10000, subtract 10%, rounding the discount down to a whole cent.
- An empty cart costs 0.
- Throw a RangeError if any unit price or quantity is negative or not an integer.`;

async function main(provider: string, model: string): Promise<number> {
  const key = process.env.KATAI_SMOKE_KEY;
  if (!key) {
    console.error("Set KATAI_SMOKE_KEY first: read -s KATAI_SMOKE_KEY && export KATAI_SMOKE_KEY");
    return 1;
  }
  const invalidKey = validateProviderKey(key);
  if (invalidKey) {
    console.error(`KATAI_SMOKE_KEY is not a usable key (${key.length} characters): ${invalidKey}`);
    return 1;
  }
  if (provider !== "anthropic") {
    console.error(`Unknown provider: ${provider}`);
    return 1;
  }
  const kata = findKata("retail-cart")!;
  const generation = await generateWithAnthropic(key, {
    model,
    spec: SPEC,
    functionName: kata.functionName,
    signature: kata.signature,
  });
  console.log(JSON.stringify(generation, null, 2));
  return generation.ok ? 0 : 1;
}

process.exitCode = await main(process.argv[2] ?? "", process.argv[3] ?? "claude-haiku-5-5");
