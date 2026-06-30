import { prisma } from "@/lib/prisma";

export async function cleanupInactiveSurveyData() {
  return prisma.$transaction(async (tx) => {
    const deletedOptions = await tx.surveyQuestionOption.deleteMany({
      where: {
        isActive: false,
        answers: { none: {} },
      },
    });

    const questions = await tx.surveyQuestion.findMany({
      where: {
        isActive: false,
        answers: { none: {} },
        options: {
          every: {
            answers: { none: {} },
          },
        },
      },
      select: { id: true },
    });

    const deletedQuestions =
      questions.length === 0
        ? { count: 0 }
        : await tx.surveyQuestion.deleteMany({
            where: {
              id: { in: questions.map((question) => question.id) },
            },
          });

    return {
      deletedOptions: deletedOptions.count,
      deletedQuestions: deletedQuestions.count,
    };
  });
}
