import type { Kata } from "../types.ts";

const requestedAt = "2026-03-10T12:00:00Z";
const knownBeneficiary = "2025-11-01T09:00:00Z";

function transfer(amountCents: number, beneficiaryAddedAt = knownBeneficiary) {
  return { amountCents, beneficiaryAddedAt, requestedAt };
}

export const bankingTransferGuard: Kata = {
  id: "banking-transfer-guard",
  title: "Transfer guard",
  level: "hard",
  sector: "banking",
  stage: "specification",
  practice: "Specifying overlapping business rules over time windows: boundaries, data to ignore and rule precedence.",
  summary: "A retail bank decides whether a mobile transfer goes through, needs strong authentication, or is refused.",
  brief: `Client: a retail bank, mobile app team.
Requested by: the payments product owner, after a review with the fraud and compliance teams.

"Before a transfer leaves the app, we must decide in real time whether it goes through, whether the customer must confirm with strong authentication, or whether it is refused. Compliance will audit the exact boundaries, so 'around 5,000 euros' is not good enough."

The function receives the new transfer and the customer's recent transfer history. Amounts are integer cents and times are ISO 8601 timestamps in UTC.

Business rules agreed with fraud and compliance:
- A transfer amount must be a positive integer; otherwise throw a RangeError.
- A transfer strictly greater than 1000000 cents (10,000 euros) is refused: "reject".
- Daily limit: add the executed transfers of the 24 hours before the request (executed strictly after the request time minus 24 hours) to the new amount. If the sum is strictly greater than 500000 cents, strong authentication is required: "strong-auth".
- New beneficiary: if the beneficiary was added less than 72 hours before the request and the amount is strictly greater than 100000 cents, strong authentication is required.
- Rejected transfers in the history never count.
- When several rules apply, the strictest outcome wins: "reject" over "strong-auth" over "accept".
- Otherwise the transfer goes through: "accept".`,
  functionName: "reviewTransfer",
  signature:
    'reviewTransfer(transfer: { amountCents: number; beneficiaryAddedAt: string; requestedAt: string }, history: { amountCents: number; executedAt: string; status: "executed" | "rejected" }[]): "accept" | "strong-auth" | "reject"',
  tests: [
    { label: "A small transfer goes through", args: [transfer(50000), []], expected: "accept" },
    {
      label: "Exactly 10,000 euros is not refused",
      args: [transfer(1000000), []],
      expected: "strong-auth",
    },
    { label: "One cent above 10,000 euros is refused", args: [transfer(1000001), []], expected: "reject" },
    {
      label: "A refusal wins over strong authentication",
      args: [transfer(1200000, "2026-03-10T08:00:00Z"), []],
      expected: "reject",
    },
    {
      label: "The daily limit triggers strong authentication",
      args: [transfer(150000), [{ amountCents: 400000, executedAt: "2026-03-10T10:00:00Z", status: "executed" }]],
      expected: "strong-auth",
    },
    {
      label: "Reaching exactly the daily limit goes through",
      args: [transfer(150000), [{ amountCents: 350000, executedAt: "2026-03-10T10:00:00Z", status: "executed" }]],
      expected: "accept",
    },
    {
      label: "Transfers older than 24 hours do not count",
      args: [transfer(150000), [{ amountCents: 400000, executedAt: "2026-03-09T11:00:00Z", status: "executed" }]],
      expected: "accept",
    },
    {
      label: "A transfer exactly 24 hours old does not count",
      args: [transfer(150000), [{ amountCents: 400000, executedAt: "2026-03-09T12:00:00Z", status: "executed" }]],
      expected: "accept",
    },
    {
      label: "Rejected transfers never count",
      args: [transfer(150000), [{ amountCents: 400000, executedAt: "2026-03-10T11:00:00Z", status: "rejected" }]],
      expected: "accept",
    },
    {
      label: "A new beneficiary triggers strong authentication",
      args: [transfer(150000, "2026-03-10T02:00:00Z"), []],
      expected: "strong-auth",
    },
    {
      label: "A beneficiary added exactly 72 hours ago is not new",
      args: [transfer(150000, "2026-03-07T12:00:00Z"), []],
      expected: "accept",
    },
    { label: "A zero amount throws a RangeError", args: [transfer(0), []], throws: "RangeError" },
  ],
};
