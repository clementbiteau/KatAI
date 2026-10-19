type Transfer = { amountCents: number; beneficiaryAddedAt: string; requestedAt: string };
type PastTransfer = { amountCents: number; executedAt: string; status: "executed" | "rejected" };
type Outcome = "accept" | "strong-auth" | "reject";

const HOUR = 60 * 60 * 1000;

function executedInLastDay(history: PastTransfer[], requestedAt: number): number {
  return history
    .filter((past) => past.status === "executed")
    .filter((past) => {
      const executedAt = Date.parse(past.executedAt);
      return executedAt > requestedAt - 24 * HOUR && executedAt <= requestedAt;
    })
    .reduce((sum, past) => sum + past.amountCents, 0);
}

export function reference(transfer: Transfer, history: PastTransfer[]): Outcome {
  const { amountCents } = transfer;
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new RangeError("Invalid amount");
  if (amountCents > 1000000) return "reject";
  const requestedAt = Date.parse(transfer.requestedAt);
  if (executedInLastDay(history, requestedAt) + amountCents > 500000) return "strong-auth";
  const newBeneficiary = requestedAt - Date.parse(transfer.beneficiaryAddedAt) < 72 * HOUR;
  if (newBeneficiary && amountCents > 100000) return "strong-auth";
  return "accept";
}

// What a vague spec ("refuse big transfers, ask for strong auth above the daily limit") produces:
// counts the whole history and ignores beneficiaries.
export function naive(transfer: Transfer, history: PastTransfer[]): Outcome {
  if (transfer.amountCents > 1000000) return "reject";
  const total = history.reduce((sum, past) => sum + past.amountCents, 0) + transfer.amountCents;
  return total > 500000 ? "strong-auth" : "accept";
}
