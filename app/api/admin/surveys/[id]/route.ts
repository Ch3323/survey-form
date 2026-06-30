import {
  parseSurveyUpdatePayload,
  updateSurveyWithQuestions,
} from "@/lib/api/survey-admin";
import {
  ApiError,
  jsonError,
  jsonOk,
  readJson,
  serialize,
  surveyInclude,
} from "@/lib/api/survey";
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
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: surveyInclude,
    });

    if (!survey) {
      throw new ApiError(404, "Survey not found");
    }

    return jsonOk({ survey: serialize(survey) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);

    const { id } = await context.params;
    const payload = parseSurveyUpdatePayload(await readJson(request));
    const survey = await updateSurveyWithQuestions(id, payload);

    return jsonOk({ survey: serialize(survey) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);

    const { id } = await context.params;
    await prisma.survey.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
