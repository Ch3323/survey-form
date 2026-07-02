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
import {
  assertJsonRequest,
  enforceRateLimit,
  requireUuid,
} from "@/lib/api/security";
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
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
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
    enforceRateLimit(request, {
      key: "admin-survey-update",
      limit: 60,
      windowMs: 60 * 1000,
    });
    assertJsonRequest(request);

    const { id } = await context.params;
    const surveyId = requireUuid(id);
    const payload = parseSurveyUpdatePayload(await readJson(request));
    const survey = await updateSurveyWithQuestions(surveyId, payload);

    return jsonOk({ survey: serialize(survey) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);
    enforceRateLimit(request, {
      key: "admin-survey-delete",
      limit: 10,
      windowMs: 60 * 1000,
    });

    const { id } = await context.params;
    const surveyId = requireUuid(id);
    await prisma.survey.delete({
      where: { id: surveyId },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
