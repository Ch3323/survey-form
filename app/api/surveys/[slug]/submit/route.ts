import {
  ApiError,
  jsonError,
  jsonOk,
  optionalString,
  readJson,
  requireObject,
  scoringSurveyInclude,
  serialize,
} from "@/lib/api/survey";
import {
  SurveyQuestionInputType,
  SurveyStatus,
} from "@/lib/generated/prisma/enums";
import {
  maxScoreForQuestions,
  summarizeAssessment,
} from "@/lib/api/survey-scoring";
import {
  assertJsonRequest,
  enforceRateLimit,
} from "@/lib/api/security";
import { prisma } from "@/lib/prisma";
import { textInputFilterIsValid } from "@/lib/survey-validation";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

type PublicSurvey = NonNullable<
  Awaited<ReturnType<typeof getActiveSurvey>>
>;

type PublicQuestion = PublicSurvey["questions"][number];

type ParsedAnswer = {
  question: PublicQuestion;
  score?: number;
  textValue?: string;
  booleanValue?: boolean;
  numberValue?: number;
  dateValue?: Date;
  selectedOptionIds: string[];
};

type ParsedSelectedOption = {
  id: string;
  score: number;
};

export async function POST(request: Request, context: Params) {
  try {
    enforceRateLimit(request, {
      key: "survey-submit",
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    assertJsonRequest(request);

    const { slug } = await context.params;
    const survey = await getActiveSurvey(slug);

    if (!survey || survey.status !== SurveyStatus.ACTIVE) {
      throw new ApiError(404, "Survey not found");
    }

    const body = requireObject(await readJson(request));
    const answers = parseAnswers(survey, body.answers);
    const scoredAnswers = answers.filter((answer) => answer.score !== undefined);
    const totalScore = scoredAnswers.reduce(
      (total, answer) => total + (answer.score ?? 0),
      0,
    );
    const averageScore =
      scoredAnswers.length > 0 ? totalScore / scoredAnswers.length : 0;
    const maxScore = maxScoreForQuestions(survey.questions);
    const { correctnessPercentage, assessmentLevel } = summarizeAssessment({
      totalScore,
      maxScore,
      correctnessThreshold: survey.correctnessThreshold,
    });

    const response = await prisma.surveyResponse.create({
      data: {
        survey: { connect: { id: survey.id } },
        anonymousKey:
          optionalString(body.anonymousKey, "anonymousKey", 120) ?? null,
        totalScore,
        maxScore,
        averageScore,
        correctnessPercentage,
        assessmentLevel,
        answers: {
          create: answers.map((answer) => ({
            question: { connect: { id: answer.question.id } },
            questionTitleSnapshot: answer.question.title,
            questionInputType: answer.question.inputType,
            score: answer.score,
            textValue: answer.textValue,
            booleanValue: answer.booleanValue,
            numberValue: answer.numberValue,
            dateValue: answer.dateValue,
            selectedOptions:
              answer.selectedOptionIds.length > 0
                ? {
                    create: answer.selectedOptionIds.map((optionId) => ({
                      option: { connect: { id: optionId } },
                    })),
                  }
                : undefined,
          })),
        },
      },
      select: {
        id: true,
        totalScore: true,
        maxScore: true,
        averageScore: true,
        correctnessPercentage: true,
        assessmentLevel: true,
        submittedAt: true,
      },
    });

    return jsonOk({ response: serialize(response) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

function getActiveSurvey(slug: string) {
  return prisma.survey.findUnique({
    where: { slug },
    include: scoringSurveyInclude,
  });
}

function parseAnswers(survey: PublicSurvey, value: unknown) {
  if (!Array.isArray(value)) {
    throw new ApiError(400, "answers must be an array");
  }

  const answersByQuestionId = new Map<string, Record<string, unknown>>();

  value.forEach((item, index) => {
    const answer = requireObject(item, `answers[${index}]`);
    const questionId = optionalString(
      answer.questionId,
      `answers[${index}].questionId`,
    );

    if (!questionId) {
      throw new ApiError(400, `answers[${index}].questionId is required`);
    }

    answersByQuestionId.set(questionId, answer);
  });

  const parsedAnswers: ParsedAnswer[] = [];

  for (const question of survey.questions) {
    const answer = answersByQuestionId.get(question.id);

    if (!answer) {
      if (question.required) {
        throw new ApiError(400, `${question.title} is required`);
      }

      continue;
    }

    const parsedAnswer = parseAnswer(question, answer);

    if (!hasAnswerValue(parsedAnswer)) {
      if (question.required) {
        throw new ApiError(400, `${question.title} is required`);
      }

      continue;
    }

    parsedAnswers.push(parsedAnswer);
  }

  return parsedAnswers;
}

function parseAnswer(question: PublicQuestion, answer: Record<string, unknown>) {
  const parsed: ParsedAnswer = {
    question,
    selectedOptionIds: [],
  };
  const rawValue = answer.value;

  switch (question.inputType) {
    case SurveyQuestionInputType.RATING:
      parsed.score = parseInteger(answer.score ?? rawValue, question.title);
      break;
    case SurveyQuestionInputType.TEXT:
    case SurveyQuestionInputType.TEXTAREA:
    case SurveyQuestionInputType.EMAIL:
    case SurveyQuestionInputType.URL:
      parsed.textValue = parseText(
        answer.textValue ?? rawValue,
        question,
      );
      break;
    case SurveyQuestionInputType.BOOLEAN:
      parsed.booleanValue = parseBoolean(
        answer.booleanValue ?? rawValue,
        question.title,
      );
      break;
    case SurveyQuestionInputType.NUMBER:
      parsed.numberValue = parseNumber(
        answer.numberValue ?? rawValue,
        question.title,
      );
      break;
    case SurveyQuestionInputType.DATE:
      parsed.dateValue = parseDate(answer.dateValue ?? rawValue, question.title);
      break;
    case SurveyQuestionInputType.SINGLE_CHOICE:
      applySelectedOptionsScore(
        parsed,
        parseSelectedOptions(question, answer, false),
      );
      break;
    case SurveyQuestionInputType.MULTIPLE_CHOICE:
      applySelectedOptionsScore(
        parsed,
        parseSelectedOptions(question, answer, true),
      );
      break;
  }

  return parsed;
}

function applySelectedOptionsScore(
  parsed: ParsedAnswer,
  selectedOptions: ParsedSelectedOption[],
) {
  parsed.selectedOptionIds = selectedOptions.map((option) => option.id);

  if (selectedOptions.length > 0) {
    parsed.score = selectedOptions.reduce(
      (total, option) => total + option.score,
      0,
    );
  }
}

function parseSelectedOptions(
  question: PublicQuestion,
  answer: Record<string, unknown>,
  allowMany: boolean,
): ParsedSelectedOption[] {
  const raw =
    answer.selectedOptionIds ?? answer.selectedOptionId ?? answer.value ?? [];
  const values = Array.isArray(raw) ? raw : [raw];
  const optionIds = values
    .map((value) => {
      if (typeof value !== "string") {
        throw new ApiError(400, `${question.title} option must be a string`);
      }

      const option = question.options.find((item) => item.id === value);

      if (!option) {
        throw new ApiError(400, `${question.title} has an invalid option`);
      }

      return {
        id: option.id,
        score: option.score,
      };
    })
    .filter(
      (value, index, all) =>
        all.findIndex((item) => item.id === value.id) === index,
    );

  if (!allowMany && optionIds.length > 1) {
    throw new ApiError(400, `${question.title} allows only one option`);
  }

  return optionIds;
}

function hasAnswerValue(answer: ParsedAnswer) {
  return (
    answer.score !== undefined ||
    answer.textValue !== undefined ||
    answer.booleanValue !== undefined ||
    answer.numberValue !== undefined ||
    answer.dateValue !== undefined ||
    answer.selectedOptionIds.length > 0
  );
}

function parseText(value: unknown, question: PublicQuestion) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${question.title} must be text`);
  }

  const text = value.trim();

  if (
    question.inputType === SurveyQuestionInputType.TEXT &&
    !textInputFilterIsValid(text, question.validation)
  ) {
    throw new ApiError(400, `${question.title} must contain only numbers`);
  }

  return text;
}

function parseInteger(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue)) {
    throw new ApiError(400, `${field} must be an integer`);
  }

  return numberValue;
}

function parseNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new ApiError(400, `${field} must be a number`);
  }

  return numberValue;
}

function parseBoolean(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new ApiError(400, `${field} must be true or false`);
  }

  return value;
}

function parseDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be a date string`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${field} must be a valid date`);
  }

  return date;
}
