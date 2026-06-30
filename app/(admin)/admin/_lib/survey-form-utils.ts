import {
  defaultRatingOptions,
  type InputType,
  type LoadedSurvey,
  type SectionMeta,
  type SurveyForm,
  type SurveyQuestion,
  type SurveyResponse,
  type SurveySection,
} from "./types";

export function emptySurveyForm(): SurveyForm {
  return {
    slug: "self-assessment",
    title: "Self Assessment",
    description: "A single self-assessment survey for every visitor.",
    status: "ACTIVE",
    sections: [defaultSection()],
    questions: [],
  };
}

export function defaultSection(): SectionMeta {
  return {
    id: crypto.randomUUID(),
    title: "Section 1",
    description: "",
    order: 0,
  };
}

export function createQuestion(
  inputType: InputType,
  sortOrder: number,
  section: SectionMeta = defaultSection(),
): SurveyQuestion {
  const choiceOptions = isChoiceType(inputType)
    ? [
        {
          label: "Option 1",
          value: "option-1",
          sortOrder: 0,
          isActive: true,
        },
        {
          label: "Option 2",
          value: "option-2",
          sortOrder: 1,
          isActive: true,
        },
      ]
    : [];
  const sectionSettings = {
    sectionId: section.id,
    sectionTitle: section.title,
    sectionDescription: section.description,
    sectionOrder: section.order,
    pageNumber: section.order + 1,
  };

  return {
    clientId: crypto.randomUUID(),
    title: "New question",
    helpText: "",
    inputType,
    sortOrder,
    placeholder: "",
    maxLength: "",
    minValue: "",
    maxValue: "",
    stepValue: "",
    required: true,
    isActive: true,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionDescription: section.description,
    sectionOrder: section.order,
    pageNumber: section.order + 1,
    settings:
      inputType === "RATING"
        ? { ...sectionSettings, ratingOptions: defaultRatingOptions }
        : sectionSettings,
    options: choiceOptions,
  };
}

export function addQuestionToSection(
  questions: SurveyQuestion[],
  sectionMetas: SectionMeta[],
  inputType: InputType,
  sectionId?: string,
) {
  const sections = groupQuestionsIntoSections(questions, sectionMetas);
  const targetSection =
    sections.find((section) => section.id === sectionId) ??
    sections[sections.length - 1] ??
    { ...defaultSection(), questions: [] };

  return [
    ...questions,
    createQuestion(inputType, questions.length, {
      id: targetSection.id,
      title: targetSection.title,
      description: targetSection.description,
      order: targetSection.order,
    }),
  ];
}

export function groupQuestionsIntoSections(
  questions: SurveyQuestion[],
  sectionMetas: SectionMeta[] = [],
): SurveySection[] {
  const sections = new Map<string, SurveySection>();

  for (const section of sectionMetas) {
    sections.set(section.id, { ...section, questions: [] });
  }

  for (const question of questions) {
    const id = question.sectionId || sectionIdFromLegacySettings(question.settings);

    if (!sections.has(id)) {
      sections.set(id, {
        id,
        title: question.sectionTitle,
        description: question.sectionDescription,
        order: question.sectionOrder,
        questions: [],
      });
    }

    sections.get(id)?.questions.push(question);
  }

  return [...sections.values()].sort((sectionA, sectionB) => {
    if (sectionA.order !== sectionB.order) {
      return sectionA.order - sectionB.order;
    }

    const firstQuestionA = questions.findIndex(
      (question) => question.clientId === sectionA.questions[0]?.clientId,
    );
    const firstQuestionB = questions.findIndex(
      (question) => question.clientId === sectionB.questions[0]?.clientId,
    );

    return firstQuestionA - firstQuestionB;
  });
}

export function surveyToForm(survey: LoadedSurvey): SurveyForm {
  const questions = survey.questions.filter((question) => question.isActive).map((question) => {
    const settings = toRecord(question.settings);

    return {
      id: question.id,
      clientId: question.id,
      title: question.title,
      helpText: question.helpText ?? "",
      inputType: question.inputType,
      sortOrder: question.sortOrder,
      placeholder: question.placeholder ?? "",
      maxLength:
        question.maxLength === null || question.maxLength === undefined
          ? ""
          : String(question.maxLength),
      minValue:
        question.minValue === null || question.minValue === undefined
          ? ""
          : String(question.minValue),
      maxValue:
        question.maxValue === null || question.maxValue === undefined
          ? ""
          : String(question.maxValue),
      stepValue:
        question.stepValue === null || question.stepValue === undefined
          ? ""
          : String(question.stepValue),
      required: question.required,
      isActive: question.isActive,
      sectionId:
        typeof settings.sectionId === "string"
          ? settings.sectionId
          : sectionIdFromLegacySettings(settings),
      sectionTitle:
        typeof settings.sectionTitle === "string" ? settings.sectionTitle : "",
      sectionDescription:
        typeof settings.sectionDescription === "string"
          ? settings.sectionDescription
          : "",
      sectionOrder:
        typeof settings.sectionOrder === "number"
          ? settings.sectionOrder
          : typeof settings.pageNumber === "number"
            ? Math.max(0, settings.pageNumber - 1)
            : 0,
      pageNumber:
        typeof settings.pageNumber === "number" ? settings.pageNumber : 1,
      settings,
      options: question.options
        .filter((option) => option.isActive)
        .map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value,
          sortOrder: option.sortOrder,
          isActive: option.isActive,
        })),
    };
  });
  const sections = groupQuestionsIntoSections(questions).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
  }));

  return {
    id: survey.id,
    slug: survey.slug,
    title: survey.title,
    description: survey.description ?? "",
    status: survey.status,
    sections: sections.length > 0 ? sections : [defaultSection()],
    questions,
  };
}

export function surveyToPayload(survey: SurveyForm) {
  return {
    slug: survey.slug,
    title: survey.title,
    description: survey.description,
    status: survey.status,
    questions: survey.questions.map((question, index) => {
      const settings = {
        ...question.settings,
        sectionId: question.sectionId,
        sectionTitle: question.sectionTitle.trim(),
        sectionDescription: question.sectionDescription.trim(),
        sectionOrder: question.sectionOrder,
        pageNumber: question.sectionOrder + 1,
      };

      return {
        id: question.id,
        title: question.title,
        helpText: question.helpText,
        inputType: question.inputType,
        sortOrder: index,
        placeholder: question.placeholder,
        maxLength: question.maxLength ? Number(question.maxLength) : null,
        minValue: question.minValue ? Number(question.minValue) : null,
        maxValue: question.maxValue ? Number(question.maxValue) : null,
        stepValue: question.stepValue ? Number(question.stepValue) : null,
        required: question.required,
        isActive: question.isActive,
        settings,
        options: isChoiceType(question.inputType)
          ? question.options.map((option, optionIndex) => ({
              id: option.id,
              label: option.label,
              value: option.value || slugify(option.label),
              sortOrder: optionIndex,
              isActive: option.isActive,
            }))
          : [],
      };
    }),
  };
}

export function questionTypePatch(
  question: SurveyQuestion,
  inputType: InputType,
): Partial<SurveyQuestion> {
  return {
    inputType,
    options:
      isChoiceType(inputType) && question.options.length === 0
        ? createQuestion(inputType, question.sortOrder).options
        : question.options,
    settings:
      inputType === "RATING"
        ? {
            ...question.settings,
            ratingOptions: getRatingOptions(),
          }
        : question.settings,
  };
}

export function formatAnswer(answer: SurveyResponse["answers"][number]) {
  if (answer.score !== null && answer.score !== undefined) {
    return String(answer.score);
  }

  if (answer.textValue) {
    return answer.textValue;
  }

  if (answer.booleanValue !== null && answer.booleanValue !== undefined) {
    return answer.booleanValue ? "Yes" : "No";
  }

  if (answer.numberValue !== null && answer.numberValue !== undefined) {
    return String(answer.numberValue);
  }

  if (answer.dateValue) {
    return new Date(answer.dateValue).toLocaleDateString();
  }

  if (answer.selectedOptions.length > 0) {
    return answer.selectedOptions.map((item) => item.option.label).join(", ");
  }

  return "-";
}

export function typeLabel(type: InputType) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function textPlaceholder(type: InputType) {
  if (type === "EMAIL") {
    return "name@example.com";
  }

  if (type === "URL") {
    return "https://example.com";
  }

  return "Short answer hint";
}

export function getRatingOptions() {
  return defaultRatingOptions;
}

export function isChoiceType(type: InputType) {
  return type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
}

export function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

  return `section-${pageNumber}-${slugify(title || "default") || "default"}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
