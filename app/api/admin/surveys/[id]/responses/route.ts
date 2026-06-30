import { jsonError, jsonOk, responseInclude, serialize } from "@/lib/api/survey";
import { requireAdmin } from "@/lib/admin-auth";
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
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: id },
      orderBy: { submittedAt: "desc" },
      include: responseInclude,
    });

    return jsonOk({ responses: serialize(responses) });
  } catch (error) {
    return jsonError(error);
  }
}
