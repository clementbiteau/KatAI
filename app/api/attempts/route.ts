import { parseSubmission, submitAttempt } from "../../../lib/server/attempts/submit.ts";
import { privateJson, withUser } from "../../../lib/server/session.ts";

export const dynamic = "force-dynamic";
// One model call of at most 60 s, plus the checks and the save (docs/adr/0005).
export const maxDuration = 90;

// Submits a spec: the model generates code, and the attempt is recorded (US4).
export const POST = withUser(async (request, user) => {
  const submission = parseSubmission(await request.json().catch(() => null));
  if ("error" in submission) return privateJson({ error: submission.error }, 400);
  const outcome = await submitAttempt(user.uid, submission);
  if (!outcome.ok) {
    const { status, ...body } = outcome;
    return privateJson({ error: body.error, code: body.code, retryAfterSeconds: body.retryAfterSeconds }, status);
  }
  return privateJson({ attempt: outcome.attempt });
});
