import { jsonError, jsonOk, serialize } from "@/lib/api/survey";
import { SurveyStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const surveys = await prisma.survey.findMany({
      where: {
        status: SurveyStatus.ACTIVE,
      },
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
