import {
  jsonError,
  jsonOk,
  optionalString,
  responseInclude,
  serialize,
} from "@/lib/api/survey";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdmin(request.headers);

    const { searchParams } = new URL(request.url);
    const surveyId = optionalString(searchParams.get("surveyId"), "surveyId");
    const surveySlug = optionalString(
      searchParams.get("surveySlug"),
      "surveySlug",
    );

    const responses = await prisma.surveyResponse.findMany({
      where: {
        surveyId,
        survey: surveySlug ? { slug: surveySlug } : undefined,
      },
      orderBy: { submittedAt: "desc" },
      include: responseInclude,
    });

    return jsonOk({ responses: serialize(responses) });
  } catch (error) {
    return jsonError(error);
  }
}
