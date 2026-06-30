import {
  ApiError,
  jsonError,
  jsonOk,
  publicSurveyInclude,
  serialize,
} from "@/lib/api/survey";
import { SurveyStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: Params) {
  try {
    const { slug } = await context.params;
    const survey = await prisma.survey.findUnique({
      where: { slug },
      include: publicSurveyInclude,
    });

    if (!survey || survey.status !== SurveyStatus.ACTIVE) {
      throw new ApiError(404, "Survey not found");
    }

    return jsonOk({ survey: serialize(survey) });
  } catch (error) {
    return jsonError(error);
  }
}

