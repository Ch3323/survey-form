import { jsonError, jsonOk, responseInclude, serialize } from "@/lib/api/survey";
import { requireAdmin } from "@/lib/admin-auth";
import { enforceRateLimit, requireUuid } from "@/lib/api/security";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);

    const { id } = await context.params;
    const surveyId = requireUuid(id);
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { submittedAt: "desc" },
      include: responseInclude,
    });

    return jsonOk({ responses: serialize(responses) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);
    enforceRateLimit(request, {
      key: "admin-responses-clear",
      limit: 10,
      windowMs: 60 * 1000,
    });

    const { id } = await context.params;
    const surveyId = requireUuid(id);
    const result = await prisma.surveyResponse.deleteMany({
      where: { surveyId },
    });

    return jsonOk({ deletedCount: result.count });
  } catch (error) {
    return jsonError(error);
  }
}
