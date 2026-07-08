import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ApiError,
  optionalBoolean,
  optionalInteger,
  optionalJson,
  optionalNumber,
  optionalString,
  parseInputType,
  parseStatus,
  requiredString,
  requireObject,
  slugify,
  surveyInclude,
} from "@/lib/api/survey";
import { SurveyStatus } from "@/lib/generated/prisma/enums";
import {
  getTextInputFilter,
  type QuestionValidation,
} from "@/lib/survey-validation";

type SurveyPayload = Record<string, unknown>;

export function parseSurveyCreatePayload(value: unknown) {
  const body = requireObject(value);
  const title = requiredString(body.title, "title", 160);
  const rawSlug = optionalString(body.slug, "slug", 80) ?? slugify(title);

  if (!rawSlug) {
    throw new ApiError(400, "slug is required");
  }

  return {
    slug: slugify(rawSlug),
    title,
    description: optionalString(body.description, "description"),
    status: parseStatus(body.status, SurveyStatus.DRAFT),
    correctnessThreshold: parseCorrectnessThreshold(
      body.correctnessThreshold,
      70,
    ),
    questions: parseQuestions(body.questions),
  };
}

export function parseSurveyUpdatePayload(value: unknown) {
  const body = requireObject(value);
  const data: SurveyPayload = {};

  if (body.slug !== undefined) {
    const slug = requiredString(body.slug, "slug", 80);
    data.slug = slugify(slug);
  }

  if (body.title !== undefined) {
    data.title = requiredString(body.title, "title", 160);
  }

  if (body.description !== undefined) {
    data.description = optionalString(body.description, "description") ?? null;
  }

  if (body.status !== undefined) {
    data.status = parseStatus(body.status);
  }

  if (body.correctnessThreshold !== undefined) {
    data.correctnessThreshold = parseCorrectnessThreshold(
      body.correctnessThreshold,
    );
  }

  return {
    data,
    replaceQuestions:
      optionalBoolean(body.replaceQuestions, "replaceQuestions") ?? false,
    questions:
      body.questions === undefined ? undefined : parseQuestions(body.questions),
  };
}

export async function createSurveyWithQuestions(
  payload: ReturnType<typeof parseSurveyCreatePayload>,
) {
  return prisma.survey.create({
    data: {
      slug: payload.slug,
      title: payload.title,
      description: payload.description,
      status: payload.status,
      correctnessThreshold: payload.correctnessThreshold,
      questions: {
        create: payload.questions.map((question) => questionToCreateData(question)),
      },
    },
    include: surveyInclude,
  });
}

export async function updateSurveyWithQuestions(
  surveyId: string,
  payload: ReturnType<typeof parseSurveyUpdatePayload>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.survey.update({
      where: { id: surveyId },
      data: payload.data,
    });

    if (payload.questions) {
      const existingQuestions = await tx.surveyQuestion.findMany({
        where: { surveyId },
        select: {
          id: true,
          options: {
            select: { id: true },
          },
        },
      });
      const existingQuestionIds = new Set(
        existingQuestions.map((question) => question.id),
      );
      const seenQuestionIds = new Set<string>();
      const replaceQuestions = payload.replaceQuestions;

      if (replaceQuestions && existingQuestionIds.size > 0) {
        await tx.surveyQuestionOption.updateMany({
          where: {
            questionId: { in: [...existingQuestionIds] },
          },
          data: { isActive: false },
        });
        await tx.surveyQuestion.updateMany({
          where: {
            id: { in: [...existingQuestionIds] },
            surveyId,
          },
          data: { isActive: false },
        });
      }

      for (const question of payload.questions) {
        let questionId = replaceQuestions ? undefined : question.id;

        if (questionId) {
          if (!existingQuestionIds.has(questionId)) {
            throw new ApiError(400, `Question ${questionId} is not in survey`);
          }

          seenQuestionIds.add(questionId);
          await tx.surveyQuestion.update({
            where: { id: questionId },
            data: questionToUpdateData(question),
          });
        } else {
          const created = await tx.surveyQuestion.create({
            data: {
              ...questionToCreateData(question),
              survey: { connect: { id: surveyId } },
            },
            select: { id: true },
          });
          questionId = created.id;
          seenQuestionIds.add(questionId);
        }

        if (question.options) {
          await upsertOptions(tx, questionId, question.options);
        }
      }

      const hiddenQuestionIds = [...existingQuestionIds].filter(
        (id) => !seenQuestionIds.has(id),
      );

      if (hiddenQuestionIds.length > 0) {
        await tx.surveyQuestion.updateMany({
          where: {
            id: { in: hiddenQuestionIds },
            surveyId,
          },
          data: { isActive: false },
        });
      }
    }

    return tx.survey.findUniqueOrThrow({
      where: { id: surveyId },
      include: surveyInclude,
    });
  });
}

function parseQuestions(value: unknown) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, "questions must be an array");
  }

  return value.map((item, index) => {
    const question = requireObject(item, `questions[${index}]`);
    const id = optionalString(question.id, `questions[${index}].id`);
    const inputType = parseInputType(question.inputType);

    return {
      id,
      title: requiredString(question.title, `questions[${index}].title`),
      helpText:
        optionalString(question.helpText, `questions[${index}].helpText`) ??
        null,
      inputType,
      sortOrder:
        optionalInteger(question.sortOrder, `questions[${index}].sortOrder`) ??
        index,
      placeholder:
        optionalString(
          question.placeholder,
          `questions[${index}].placeholder`,
          255,
        ) ?? null,
      defaultValue:
        optionalString(question.defaultValue, `questions[${index}].defaultValue`) ??
        null,
      maxLength:
        optionalInteger(question.maxLength, `questions[${index}].maxLength`) ??
        null,
      minValue:
        optionalNumber(question.minValue, `questions[${index}].minValue`) ??
        null,
      maxValue:
        optionalNumber(question.maxValue, `questions[${index}].maxValue`) ??
        null,
      stepValue:
        optionalNumber(question.stepValue, `questions[${index}].stepValue`) ??
        null,
      settings: optionalJson(question.settings),
      validation: parseQuestionValidation(inputType, question.validation),
      required:
        optionalBoolean(question.required, `questions[${index}].required`) ??
        true,
      isActive:
        optionalBoolean(question.isActive, `questions[${index}].isActive`) ??
        true,
      options:
        question.options === undefined
          ? undefined
          : parseOptions(question.options, index),
    };
  });
}

function parseCorrectnessThreshold(value: unknown, fallback?: number) {
  const threshold = optionalInteger(value, "correctnessThreshold") ?? fallback;

  if (threshold === undefined) {
    return undefined;
  }

  if (threshold < 0 || threshold > 100) {
    throw new ApiError(400, "correctnessThreshold must be between 0 and 100");
  }

  return threshold;
}

function parseQuestionValidation(
  inputType: ReturnType<typeof parseInputType>,
  value: unknown,
) {
  if (value === undefined) {
    return undefined;
  }

  if (inputType !== "TEXT") {
    return {};
  }

  const inputFilter = getTextInputFilter(value);
  const validation: QuestionValidation = {};

  if (inputFilter !== "NONE") {
    validation.inputFilter = inputFilter;
  }

  return validation;
}

function parseOptions(value: unknown, questionIndex: number) {
  if (!Array.isArray(value)) {
    throw new ApiError(400, `questions[${questionIndex}].options must be an array`);
  }

  return value.map((item, index) => {
    const option = requireObject(
      item,
      `questions[${questionIndex}].options[${index}]`,
    );
    const label = requiredString(
      option.label,
      `questions[${questionIndex}].options[${index}].label`,
    );

    return {
      id: optionalString(
        option.id,
        `questions[${questionIndex}].options[${index}].id`,
      ),
      label,
      value:
        optionalString(
          option.value,
          `questions[${questionIndex}].options[${index}].value`,
          160,
        ) ||
        slugify(label) ||
        `option-${index + 1}`,
      sortOrder:
        optionalInteger(
          option.sortOrder,
          `questions[${questionIndex}].options[${index}].sortOrder`,
        ) ?? index,
      score:
        optionalInteger(
          option.score,
          `questions[${questionIndex}].options[${index}].score`,
        ) ?? 0,
      isActive:
        optionalBoolean(
          option.isActive,
          `questions[${questionIndex}].options[${index}].isActive`,
        ) ?? true,
    };
  });
}

function questionToCreateData(question: ReturnType<typeof parseQuestions>[number]) {
  return {
    title: question.title,
    helpText: question.helpText,
    inputType: question.inputType,
    sortOrder: question.sortOrder,
    placeholder: question.placeholder,
    defaultValue: question.defaultValue,
    maxLength: question.maxLength,
    minValue: question.minValue,
    maxValue: question.maxValue,
    stepValue: question.stepValue,
    settings: question.settings,
    validation: question.validation,
    required: question.required,
    isActive: question.isActive,
    options: question.options
      ? {
          create: question.options.map((option) => ({
            label: option.label,
            value: option.value,
            score: option.score,
            sortOrder: option.sortOrder,
            isActive: option.isActive,
          })),
        }
      : undefined,
  };
}

function questionToUpdateData(question: ReturnType<typeof parseQuestions>[number]) {
  return {
    title: question.title,
    helpText: question.helpText,
    inputType: question.inputType,
    sortOrder: question.sortOrder,
    placeholder: question.placeholder,
    defaultValue: question.defaultValue,
    maxLength: question.maxLength,
    minValue: question.minValue,
    maxValue: question.maxValue,
    stepValue: question.stepValue,
    settings: question.settings,
    validation: question.validation,
    required: question.required,
    isActive: question.isActive,
  };
}

async function upsertOptions(
  tx: Prisma.TransactionClient,
  questionId: string,
  options: NonNullable<ReturnType<typeof parseQuestions>[number]["options"]>,
) {
  const existingOptions = await tx.surveyQuestionOption.findMany({
    where: { questionId },
    select: { id: true },
  });
  const existingOptionIds = new Set(existingOptions.map((option) => option.id));
  const seenOptionIds = new Set<string>();

  for (const option of options) {
    if (option.id) {
      if (!existingOptionIds.has(option.id)) {
        throw new ApiError(400, `Option ${option.id} is not in question`);
      }

      seenOptionIds.add(option.id);
      await tx.surveyQuestionOption.update({
        where: { id: option.id },
        data: {
          label: option.label,
          value: option.value,
          score: option.score,
          sortOrder: option.sortOrder,
          isActive: option.isActive,
        },
      });
    } else {
      const created = await tx.surveyQuestionOption.create({
        data: {
          question: { connect: { id: questionId } },
          label: option.label,
          value: option.value,
          score: option.score,
          sortOrder: option.sortOrder,
          isActive: option.isActive,
        },
        select: { id: true },
      });
      seenOptionIds.add(created.id);
    }
  }

  const hiddenOptionIds = [...existingOptionIds].filter(
    (id) => !seenOptionIds.has(id),
  );

  if (hiddenOptionIds.length > 0) {
    await tx.surveyQuestionOption.updateMany({
      where: {
        id: { in: hiddenOptionIds },
        questionId,
      },
      data: { isActive: false },
    });
  }
}
