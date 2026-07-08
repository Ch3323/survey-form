import { AssessmentLevel, SurveyQuestionInputType } from "@/lib/generated/prisma/enums";
import { isRecord } from "@/lib/api/survey";

type ScoringQuestion = {
  inputType: SurveyQuestionInputType;
  settings?: unknown;
  options?: Array<{
    score: number;
  }>;
};

const DEFAULT_CORRECTNESS_THRESHOLD = 70;

export function normalizeCorrectnessThreshold(value: number | undefined) {
  if (value === undefined) {
    return DEFAULT_CORRECTNESS_THRESHOLD;
  }

  return Math.min(100, Math.max(0, value));
}

export function maxScoreForQuestions(questions: ScoringQuestion[]) {
  return questions.reduce(
    (total, question) => total + maxScoreForQuestion(question),
    0,
  );
}

export function summarizeAssessment({
  totalScore,
  maxScore,
  correctnessThreshold,
}: {
  totalScore: number;
  maxScore: number;
  correctnessThreshold: number;
}) {
  const correctnessPercentage =
    maxScore > 0 ? roundPercentage((totalScore / maxScore) * 100) : 0;
  const assessmentLevel =
    correctnessPercentage >= normalizeCorrectnessThreshold(correctnessThreshold)
      ? AssessmentLevel.ADVANCED
      : AssessmentLevel.BEGINNER;

  return {
    correctnessPercentage,
    assessmentLevel,
  };
}

function maxScoreForQuestion(question: ScoringQuestion) {
  switch (question.inputType) {
    case SurveyQuestionInputType.RATING:
      return maxRatingScore(question.settings);
    case SurveyQuestionInputType.SINGLE_CHOICE:
      return Math.max(0, ...scoreValues(question.options));
    case SurveyQuestionInputType.MULTIPLE_CHOICE:
      return scoreValues(question.options).reduce(
        (total, score) => total + Math.max(0, score),
        0,
      );
    default:
      return 0;
  }
}

function maxRatingScore(settings: unknown) {
  const ratingOptions = isRecord(settings) ? settings.ratingOptions : undefined;

  if (!Array.isArray(ratingOptions)) {
    return 5;
  }

  const scores = ratingOptions
    .map((option) => {
      if (!isRecord(option)) {
        return undefined;
      }

      const value = option.value;
      const score = typeof value === "number" ? value : Number(value);

      return Number.isFinite(score) ? score : undefined;
    })
    .filter((score): score is number => score !== undefined);

  return scores.length > 0 ? Math.max(0, ...scores) : 5;
}

function scoreValues(options: ScoringQuestion["options"] = []) {
  return options
    .map((option) => option.score)
    .filter((score) => Number.isFinite(score));
}

function roundPercentage(value: number) {
  const clamped = Math.min(100, Math.max(0, value));

  return Math.round(clamped * 100) / 100;
}
