import {
  firstPageNumber,
  groupQuestionsByPage,
  questionHasValue,
} from "./survey-utils";
import type { AnswerValue, Answers, LoadedSurvey, SurveyQuestion } from "./types";

const DRAFT_VERSION = 1;
const DRAFT_KEY_PREFIX = "survey-form:draft";

type SurveyDraft = {
  version: number;
  surveyId: string;
  surveySlug: string;
  currentPage: number;
  answers: Answers;
  updatedAt: string;
};

export function readSurveyDraft(survey: LoadedSurvey) {
  const storedValue = readLocalStorage(draftKey(survey.id));

  if (!storedValue) {
    return null;
  }

  const parsed = parseDraft(storedValue);

  if (!parsed || parsed.surveyId !== survey.id) {
    return null;
  }

  return {
    answers: sanitizeAnswers(survey.questions, parsed.answers),
    currentPage: sanitizeCurrentPage(survey, parsed.currentPage),
  };
}

export function writeSurveyDraft(
  survey: LoadedSurvey,
  answers: Answers,
  currentPage: number,
) {
  writeLocalStorage(
    draftKey(survey.id),
    JSON.stringify({
      version: DRAFT_VERSION,
      surveyId: survey.id,
      surveySlug: survey.slug,
      currentPage: sanitizeCurrentPage(survey, currentPage),
      answers: sanitizeAnswers(survey.questions, answers),
      updatedAt: new Date().toISOString(),
    } satisfies SurveyDraft),
  );
}

export function clearSurveyDraft(surveyId: string) {
  try {
    window.localStorage.removeItem(draftKey(surveyId));
  } catch {
    // Local storage can be unavailable in private browsing or locked-down webviews.
  }
}

function draftKey(surveyId: string) {
  return `${DRAFT_KEY_PREFIX}:${surveyId}`;
}

function parseDraft(value: string): SurveyDraft | null {
  try {
    const parsed = JSON.parse(value) as Partial<SurveyDraft>;

    if (
      parsed.version !== DRAFT_VERSION ||
      typeof parsed.surveyId !== "string" ||
      typeof parsed.surveySlug !== "string" ||
      typeof parsed.currentPage !== "number" ||
      !isAnswerRecord(parsed.answers) ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }

    return parsed as SurveyDraft;
  } catch {
    return null;
  }
}

function sanitizeCurrentPage(survey: LoadedSurvey, currentPage: number) {
  const validPages = new Set(
    groupQuestionsByPage(survey.questions).map((page) => page.pageNumber),
  );

  return validPages.has(currentPage)
    ? currentPage
    : firstPageNumber(survey.questions);
}

function sanitizeAnswers(questions: SurveyQuestion[], answers: Answers) {
  const questionById = new Map(
    questions.map((question) => [question.id, question]),
  );

  return Object.fromEntries(
    Object.entries(answers).filter(([questionId, answer]) => {
      const question = questionById.get(questionId);

      return question
        ? isValidAnswerValue(answer) && questionHasValue(question, answer)
        : false;
    }),
  ) satisfies Answers;
}

function isAnswerRecord(value: unknown): value is Answers {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidAnswerValue(value: unknown): value is AnswerValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readLocalStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore quota and availability failures; the form still works without draft storage.
  }
}
