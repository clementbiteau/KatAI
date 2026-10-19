type CartLine = { sku: string; unitPriceCents: number; quantity: number };

export function reference(lines: CartLine[]): number {
  const quantities = new Map<string, number>();
  const prices = new Map<string, number>();
  for (const { sku, unitPriceCents, quantity } of lines) {
    const valid = [unitPriceCents, quantity].every((value) => Number.isInteger(value) && value >= 0);
    if (!valid) throw new RangeError(`Invalid cart line for ${sku}`);
    quantities.set(sku, (quantities.get(sku) ?? 0) + quantity);
    prices.set(sku, unitPriceCents);
  }
  let total = 0;
  for (const [sku, quantity] of quantities) {
    total += (prices.get(sku) ?? 0) * (quantity - Math.floor(quantity / 3));
  }
  return total > 10000 ? total - Math.floor(total / 10) : total;
}

// What a vague spec ("sum the cart") typically produces.
export function naive(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0);
}
