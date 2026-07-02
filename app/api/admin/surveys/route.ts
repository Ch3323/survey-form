import {
  createSurveyWithQuestions,
  parseSurveyCreatePayload,
} from "@/lib/api/survey-admin";
import {
  ApiError,
  jsonError,
  jsonOk,
  parseStatus,
  readJson,
  serialize,
} from "@/lib/api/survey";
import { requireAdmin } from "@/lib/admin-auth";
import {
  assertJsonRequest,
  enforceRateLimit,
} from "@/lib/api/security";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdmin(request.headers);

    const { searchParams } = new URL(request.url);
    const status = parseStatus(searchParams.get("status"));

    const surveys = await prisma.survey.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
    });

    return jsonOk({ surveys: serialize(surveys) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request.headers);
    enforceRateLimit(request, {
      key: "admin-survey-create",
      limit: 30,
      windowMs: 60 * 1000,
    });
    assertJsonRequest(request);

    const existingSurveyCount = await prisma.survey.count();

    if (existingSurveyCount > 0) {
      throw new ApiError(409, "Only one survey can be managed in this app");
    }

    const payload = parseSurveyCreatePayload(await readJson(request));
    const survey = await createSurveyWithQuestions(payload);

    return jsonOk({ survey: serialize(survey) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
