import { jsonError } from "@/lib/api/survey";
import { requireAdmin } from "@/lib/admin-auth";
import { enforceRateLimit, requireUuid } from "@/lib/api/security";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);
    enforceRateLimit(request, {
      key: "admin-answer-delete",
      limit: 60,
      windowMs: 60 * 1000,
    });

    const { id } = await context.params;
    const answerId = requireUuid(id);

    await prisma.$transaction(async (tx) => {
      const answer = await tx.surveyAnswer.delete({
        where: { id: answerId },
        select: {
          responseId: true,
        },
      });
      const remainingAnswers = await tx.surveyAnswer.findMany({
        where: {
          responseId: answer.responseId,
          score: { not: null },
        },
        select: {
          score: true,
        },
      });
      const totalScore = remainingAnswers.reduce(
        (total, item) => total + (item.score ?? 0),
        0,
      );
      const averageScore =
        remainingAnswers.length > 0 ? totalScore / remainingAnswers.length : 0;

      await tx.surveyResponse.update({
        where: {
          id: answer.responseId,
        },
        data: {
          totalScore,
          averageScore,
        },
      });
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
