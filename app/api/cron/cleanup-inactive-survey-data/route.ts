import { cleanupInactiveSurveyData } from "@/lib/api/survey-cleanup";
import { ApiError, jsonError, jsonOk } from "@/lib/api/survey";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    authorizeCronRequest(request);

    const result = await cleanupInactiveSurveyData();

    return jsonOk({
      ok: true,
      ...result,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  return GET(request);
}

function authorizeCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    throw new ApiError(500, "CRON_SECRET is not configured");
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;
  const headerSecret = request.headers.get("x-cron-secret");

  if (bearerToken !== secret && headerSecret !== secret) {
    throw new ApiError(401, "Unauthorized");
  }
}
