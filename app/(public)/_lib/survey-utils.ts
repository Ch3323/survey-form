import {
  defaultRatingOptions,
  type AnswerValue,
  type PageGroup,
  type SurveyQuestion,
  type InputType,
} from "./types";
import { applyTextInputFilter } from "@/lib/survey-validation";

export function groupQuestionsByPage(questions: SurveyQuestion[]): PageGroup[] {
  const groups = new Map<string, PageGroup>();

  for (const question of questions) {
    const settings = toRecord(question.settings);
    const sectionId =
      typeof settings.sectionId === "string"
        ? settings.sectionId
        : sectionIdFromLegacySettings(settings);
    const pageNumber =
      typeof settings.sectionOrder === "number"
        ? settings.sectionOrder + 1
        : typeof settings.pageNumber === "number" && settings.pageNumber > 0
          ? settings.pageNumber
          : 1;
    const title =
      typeof settings.sectionTitle === "string" ? settings.sectionTitle : "";
    const description =
      typeof settings.sectionDescription === "string"
        ? settings.sectionDescription
        : "";

    if (!groups.has(sectionId)) {
      groups.set(sectionId, {
        pageNumber,
        title,
        description,
        questions: [],
      });
    }

    groups.get(sectionId)?.questions.push(question);
  }

  return [...groups.values()].sort(
    (sectionA, sectionB) => sectionA.pageNumber - sectionB.pageNumber,
  );
}

export function firstPageNumber(questions: SurveyQuestion[]) {
  return groupQuestionsByPage(questions)[0]?.pageNumber ?? 1;
}

export function questionHasValue(
  question: SurveyQuestion,
  value: AnswerValue | undefined,
) {
  if (value === undefined || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    const normalizedValue = normalizeAnswerValue(question, value);

    return typeof normalizedValue === "string"
      ? normalizedValue.trim().length > 0
      : false;
  }

  if (question.inputType === "RATING") {
    return typeof value === "number" && value > 0;
  }

  return true;
}

export function toPayloadAnswer(
  question: SurveyQuestion,
  value: AnswerValue | undefined,
) {
  if (!questionHasValue(question, value)) {
    return null;
  }

  switch (question.inputType) {
    case "RATING":
      return { questionId: question.id, score: Number(value) };
    case "BOOLEAN":
      return { questionId: question.id, booleanValue: value };
    case "NUMBER":
      return { questionId: question.id, numberValue: value };
    case "DATE":
      return { questionId: question.id, dateValue: value };
    case "SINGLE_CHOICE":
      return { questionId: question.id, selectedOptionIds: [value] };
    case "MULTIPLE_CHOICE":
      return { questionId: question.id, selectedOptionIds: value };
    case "TEXT":
    case "TEXTAREA":
    case "EMAIL":
    case "URL":
    default:
      return {
        questionId: question.id,
        value: normalizeAnswerValue(question, value),
      };
  }
}

export function normalizeAnswerValue(
  question: SurveyQuestion,
  value: AnswerValue | undefined,
): AnswerValue | undefined {
  if (question.inputType === "TEXT" && typeof value === "string") {
    return applyTextInputFilter(value, question.validation);
  }

  return value;
}

export function inputTypeToHtmlType(inputType: InputType) {
  if (inputType === "EMAIL") {
    return "email";
  }

  if (inputType === "URL") {
    return "url";
  }

  return "text";
}

export function getRatingOptions() {
  return defaultRatingOptions;
}

export function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export async function readJsonResponse<T>(response: Response) {
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(data.error || "Server request failed");
  }

  return data;
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function sectionIdFromLegacySettings(settings: Record<string, unknown>) {
  const title =
    typeof settings.sectionTitle === "string" ? settings.sectionTitle : "";
  const pageNumber =
    typeof settings.pageNumber === "number" && settings.pageNumber > 0
      ? settings.pageNumber
      : 1;

  return `section-${pageNumber}-${title || "default"}`;
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
