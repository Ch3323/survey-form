import {
  jsonError,
  jsonOk,
  serialize,
  surveyInclude,
} from "@/lib/api/survey";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdmin(request.headers);

    const survey = await prisma.survey.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        ...surveyInclude,
        _count: {
          select: {
            responses: true,
          },
        },
      },
    });

    return jsonOk({ survey: serialize(survey) });
  } catch (error) {
    return jsonError(error);
  }
}
