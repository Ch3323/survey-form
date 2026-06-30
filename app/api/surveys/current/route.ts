import {
  ApiError,
  jsonError,
  jsonOk,
  publicSurveyInclude,
  serialize,
} from "@/lib/api/survey";
import { SurveyStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const survey = await prisma.survey.findFirst({
      where: {
        status: SurveyStatus.ACTIVE,
      },
      orderBy: { updatedAt: "desc" },
      include: publicSurveyInclude,
    });

    if (!survey) {
      throw new ApiError(404, "No active survey found");
    }

    return jsonOk({ survey: serialize(survey) });
  } catch (error) {
    return jsonError(error);
  }
}
