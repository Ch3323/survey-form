import {
  ApiError,
  jsonError,
  jsonOk,
  responseInclude,
  serialize,
} from "@/lib/api/survey";
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
    const responseId = requireUuid(id);
    const response = await prisma.surveyResponse.findUnique({
      where: { id: responseId },
      include: responseInclude,
    });

    if (!response) {
      throw new ApiError(404, "Response not found");
    }

    return jsonOk({ response: serialize(response) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);
    enforceRateLimit(request, {
      key: "admin-response-delete",
      limit: 60,
      windowMs: 60 * 1000,
    });

    const { id } = await context.params;
    const responseId = requireUuid(id);
    await prisma.surveyResponse.delete({
      where: { id: responseId },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
