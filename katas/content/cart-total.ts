import type { Kata } from "../types.ts";

export const cartTotal: Kata = {
  id: "cart-total",
  title: "Cart total",
  level: "easy",
  summary: "Compute a shopping cart total with a multi-buy offer and a threshold discount.",
  statement: `Write a function that returns the total price of a shopping cart, in cents.

Each cart line has a sku (a product identifier), a unit price in cents and a quantity.

Rules:
- Lines that share the same sku are combined into a single line before any offer applies. Lines with the same sku always have the same unit price.
- Multi-buy offer: for each sku, every third unit is free. With 7 units, you pay for 5.
- Threshold discount: if the total after the multi-buy offer is strictly greater than 10000 cents, take 10% off the whole cart. The discount is rounded down to a whole cent.
- An empty cart costs 0.
- If any unit price or quantity is negative or not an integer, throw a RangeError.`,
  functionName: "cartTotal",
  signature: "cartTotal(lines: { sku: string; unitPriceCents: number; quantity: number }[]): number",
  tests: [
    { label: "An empty cart costs 0", args: [[]], expected: 0 },
    {
      label: "A single line without offer",
      args: [[{ sku: "pen", unitPriceCents: 150, quantity: 2 }]],
      expected: 300,
    },
    {
      label: "Every third unit is free",
      args: [[{ sku: "cup", unitPriceCents: 200, quantity: 3 }]],
      expected: 400,
    },
    {
      label: "Seven units cost five",
      args: [[{ sku: "cup", unitPriceCents: 200, quantity: 7 }]],
      expected: 1000,
    },
    {
      label: "Lines with the same sku are combined before the offer",
      args: [
        [
          { sku: "mug", unitPriceCents: 500, quantity: 2 },
          { sku: "mug", unitPriceCents: 500, quantity: 1 },
        ],
      ],
      expected: 1000,
    },
    {
      label: "Different skus are not combined",
      args: [
        [
          { sku: "mug", unitPriceCents: 500, quantity: 2 },
          { sku: "bowl", unitPriceCents: 500, quantity: 1 },
        ],
      ],
      expected: 1500,
    },
    {
      label: "No discount at exactly 10000 cents",
      args: [[{ sku: "lamp", unitPriceCents: 5000, quantity: 2 }]],
      expected: 10000,
    },
    {
      label: "The discount is rounded down to a whole cent",
      args: [[{ sku: "chair", unitPriceCents: 10005, quantity: 1 }]],
      expected: 9005,
    },
    {
      label: "The threshold applies after the multi-buy offer",
      args: [[{ sku: "book", unitPriceCents: 4000, quantity: 3 }]],
      expected: 8000,
    },
    {
      label: "Offer and discount combine on a large cart",
      args: [[{ sku: "plate", unitPriceCents: 3000, quantity: 6 }]],
      expected: 10800,
    },
    {
      label: "A negative quantity throws a RangeError",
      args: [[{ sku: "pen", unitPriceCents: 150, quantity: -1 }]],
      throws: "RangeError",
    },
    {
      label: "A non-integer price throws a RangeError",
      args: [[{ sku: "pen", unitPriceCents: 12.5, quantity: 1 }]],
      throws: "RangeError",
    },
  ],
};
