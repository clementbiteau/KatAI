import type { Kata } from "../types.ts";

export const retailCart: Kata = {
  id: "retail-cart",
  title: "Autumn campaign cart",
  level: "easy",
  sector: "retail",
  stage: "specification",
  practice: "Turning a client's pricing rules into an unambiguous spec: precedence, thresholds and rounding.",
  summary: "A sports retailer launches a multi-buy offer and a basket discount on its online shop.",
  brief: `Client: a mid-size sports retailer with 140 stores and an online shop.
Requested by: the e-commerce product owner, for the autumn campaign.

"For the autumn campaign we run two promotions on the online shop, and the cart total must apply them exactly as the marketing team signed off. Our payment provider only accepts integer amounts in cents."

Business rules agreed in the workshop:
- The cart is a list of lines, each with a sku (product reference), a unit price in cents and a quantity.
- A customer may add the same product twice from different pages: lines sharing a sku are combined before any promotion. Lines with the same sku always carry the same unit price.
- Multi-buy offer: on each sku, every third unit is free. With 7 units, the customer pays for 5.
- Basket discount: if the total after the multi-buy offer is strictly greater than 10000 cents, the whole cart gets 10% off. Finance requires the discount to be rounded down to a whole cent.
- An empty cart costs 0.
- A negative or non-integer unit price or quantity means corrupted data: the function must throw a RangeError rather than return a price.`,
  functionName: "cartTotal",
  signature: "cartTotal(lines: { sku: string; unitPriceCents: number; quantity: number }[]): number",
  tests: [
    { label: "An empty cart costs 0", args: [[]], expected: 0 },
    {
      label: "A single line without offer",
      args: [[{ sku: "socks", unitPriceCents: 150, quantity: 2 }]],
      expected: 300,
    },
    {
      label: "Every third unit is free",
      args: [[{ sku: "bottle", unitPriceCents: 200, quantity: 3 }]],
      expected: 400,
    },
    {
      label: "Seven units cost five",
      args: [[{ sku: "bottle", unitPriceCents: 200, quantity: 7 }]],
      expected: 1000,
    },
    {
      label: "Lines with the same sku are combined before the offer",
      args: [
        [
          { sku: "cap", unitPriceCents: 500, quantity: 2 },
          { sku: "cap", unitPriceCents: 500, quantity: 1 },
        ],
      ],
      expected: 1000,
    },
    {
      label: "Different skus are not combined",
      args: [
        [
          { sku: "cap", unitPriceCents: 500, quantity: 2 },
          { sku: "headband", unitPriceCents: 500, quantity: 1 },
        ],
      ],
      expected: 1500,
    },
    {
      label: "No discount at exactly 10000 cents",
      args: [[{ sku: "racket", unitPriceCents: 5000, quantity: 2 }]],
      expected: 10000,
    },
    {
      label: "The discount is rounded down to a whole cent",
      args: [[{ sku: "bike-helmet", unitPriceCents: 10005, quantity: 1 }]],
      expected: 9005,
    },
    {
      label: "The basket discount applies after the multi-buy offer",
      args: [[{ sku: "running-shoes", unitPriceCents: 4000, quantity: 3 }]],
      expected: 8000,
    },
    {
      label: "Offer and discount combine on a large cart",
      args: [[{ sku: "jersey", unitPriceCents: 3000, quantity: 6 }]],
      expected: 10800,
    },
    {
      label: "A negative quantity throws a RangeError",
      args: [[{ sku: "socks", unitPriceCents: 150, quantity: -1 }]],
      throws: "RangeError",
    },
    {
      label: "A non-integer price throws a RangeError",
      args: [[{ sku: "socks", unitPriceCents: 12.5, quantity: 1 }]],
      throws: "RangeError",
    },
  ],
};
