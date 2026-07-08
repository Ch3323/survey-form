import {
  ApiError,
  jsonError,
  jsonOk,
  readJson,
  requireObject,
  serialize,
} from "@/lib/api/survey";
import {
  assertJsonRequest,
  enforceRateLimit,
  requireUuid,
} from "@/lib/api/security";
import {
  AssessmentLevel,
  type AssessmentLevel as AssessmentLevelValue,
} from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: Params) {
  try {
    enforceRateLimit(request, {
      key: "public-response-assessment-level",
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    assertJsonRequest(request);

    const { id } = await context.params;
    const responseId = requireUuid(id);
    const body = requireObject(await readJson(request));
    const assessmentLevel = parseAssessmentLevel(body.assessmentLevel);
    const response = await prisma.surveyResponse.update({
      where: { id: responseId },
      data: { assessmentLevel },
      select: {
        id: true,
        assessmentLevel: true,
      },
    });

    return jsonOk({ response: serialize(response) });
  } catch (error) {
    return jsonError(error);
  }
}

function parseAssessmentLevel(value: unknown): AssessmentLevelValue {
  if (
    typeof value !== "string" ||
    !Object.values(AssessmentLevel).includes(value as AssessmentLevelValue)
  ) {
    throw new ApiError(400, "assessmentLevel is invalid");
  }

  return value as AssessmentLevelValue;
}
