import { listProviderKeyStatuses } from "../../../lib/server/data/provider-keys.ts";
import { privateJson, withUser } from "../../../lib/server/session.ts";

export const dynamic = "force-dynamic";

// Configuration status of the signed-in user's provider keys (CA2.2).
export const GET = withUser(async (_request, user) => privateJson({ keys: await listProviderKeyStatuses(user.uid) }));
