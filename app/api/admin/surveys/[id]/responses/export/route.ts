import {
  buildSurveyResponsesExcel,
  parseExportColumnKeys,
  surveyResponsesExcelFilename,
} from "@/lib/api/survey-export";
import { jsonError } from "@/lib/api/survey";
import { requireUuid } from "@/lib/api/security";
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
    const surveyId = requireUuid(id);
    const survey = await prisma.survey.findUniqueOrThrow({
      where: { id: surveyId },
      select: {
        slug: true,
        title: true,
        questions: {
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          select: {
            id: true,
            title: true,
            sortOrder: true,
          },
        },
        responses: {
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            anonymousKey: true,
            totalScore: true,
            maxScore: true,
            averageScore: true,
            correctnessPercentage: true,
            assessmentLevel: true,
            submittedAt: true,
            answers: {
              orderBy: { createdAt: "asc" },
              select: {
                questionId: true,
                questionTitleSnapshot: true,
                questionInputType: true,
                score: true,
                textValue: true,
                booleanValue: true,
                numberValue: true,
                dateValue: true,
                selectedOptions: {
                  select: {
                    option: {
                      select: {
                        label: true,
                        value: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { searchParams } = new URL(request.url);
    const body = buildSurveyResponsesExcel(
      survey,
      parseExportColumnKeys(searchParams),
    );

    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${surveyResponsesExcelFilename(survey.slug)}"`,
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
