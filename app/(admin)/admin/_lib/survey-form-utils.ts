import {
  defaultRatingOptions,
  type InputType,
  inputTypes,
  type LoadedSurvey,
  type SectionMeta,
  type SurveyForm,
  type SurveyQuestion,
  type SurveyResponse,
  type SurveySection,
} from "./types";
import {
  getTextInputFilter,
  type TextInputFilter,
} from "@/lib/survey-validation";

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
          score: "0",
          sortOrder: 0,
          isActive: true,
        },
        {
          label: "Option 2",
          value: "option-2",
          score: "0",
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
    validation: {},
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
    const validation = toRecord(question.validation);

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
      validation,
      options: question.options
        .filter((option) => option.isActive)
        .map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value,
          score: String(option.score ?? 0),
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
    status: surveyStatusToMode(survey.status),
    sections: sections.length > 0 ? sections : [defaultSection()],
    questions,
  };
}

export function surveyToPayload(survey: SurveyForm) {
  return {
    ...(survey.id ? {} : { slug: survey.slug }),
    title: survey.title,
    description: survey.description,
    status: surveyModeToPayloadStatus(survey.status),
    replaceQuestions: survey.replaceQuestions === true,
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
        id: survey.replaceQuestions ? undefined : question.id,
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
        validation: normalizeQuestionValidation(question),
        options: isChoiceType(question.inputType)
          ? toPayloadOptions(question.options, survey.replaceQuestions === true)
          : [],
      };
    }),
  };
}

function surveyStatusToMode(status: LoadedSurvey["status"]): SurveyForm["status"] {
  return status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
}

function surveyModeToPayloadStatus(status: SurveyForm["status"]) {
  return status === "ACTIVE" ? "ACTIVE" : "DRAFT";
}

export function importFormTemplate(
  survey: SurveyForm,
  value: unknown,
): SurveyForm {
  const template = parseFormTemplate(value);
  const sections =
    template.sections.length > 0
      ? template.sections.map((section, index) => ({
          id: section.id || crypto.randomUUID(),
          title: section.title || `Section ${index + 1}`,
          description: section.description,
          order: index,
        }))
      : [defaultSection()];
  const questions = template.sections.flatMap((section, sectionIndex) => {
    const sectionMeta = sections[sectionIndex] ?? sections[0];

    return section.questions.map((question, questionIndex) => {
      const sortOrder = template.sections
        .slice(0, sectionIndex)
        .reduce((count, item) => count + item.questions.length, questionIndex);
      const baseQuestion = createQuestion(
        question.inputType,
        sortOrder,
        sectionMeta,
      );

      return {
        ...baseQuestion,
        title: question.title,
        helpText: question.helpText,
        placeholder: question.placeholder,
        maxLength: question.maxLength,
        minValue: question.minValue,
        maxValue: question.maxValue,
        stepValue: question.stepValue,
        validation: normalizeTemplateValidation(question.validation),
        required: question.required,
        isActive: question.isActive,
        options: isChoiceType(question.inputType)
          ? question.options.length > 0
            ? question.options
            : baseQuestion.options
          : [],
      };
    });
  });

  return {
    ...survey,
    replaceQuestions: true,
    sections,
    questions,
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
    validation:
      inputType === "TEXT" ? normalizeQuestionValidation(question) : {},
  };
}

export function formatAnswer(answer: SurveyResponse["answers"][number]) {
  if (answer.selectedOptions.length > 0) {
    return answer.selectedOptions.map((item) => item.option.label).join(", ");
  }

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

function parseFormTemplate(value: unknown) {
  const template = requireTemplateObject(value, "template");
  const sections = template.sections;

  if (!Array.isArray(sections)) {
    throw new Error("Template sections must be an array");
  }

  return {
    sections: sections.map((sectionValue, sectionIndex) => {
      const section = requireTemplateObject(
        sectionValue,
        `sections[${sectionIndex}]`,
      );
      const questions = section.questions;

      if (!Array.isArray(questions)) {
        throw new Error(`sections[${sectionIndex}].questions must be an array`);
      }

      return {
        id: optionalTemplateString(section.id),
        title: optionalTemplateString(section.title),
        description: optionalTemplateString(section.description),
        questions: questions.map((questionValue, questionIndex) =>
          parseTemplateQuestion(
            questionValue,
            `sections[${sectionIndex}].questions[${questionIndex}]`,
          ),
        ),
      };
    }),
  };
}

function parseTemplateQuestion(value: unknown, field: string) {
  const question = requireTemplateObject(value, field);
  const inputType = parseTemplateInputType(question.inputType, `${field}.inputType`);

  return {
    title: requiredTemplateString(question.title, `${field}.title`),
    helpText: optionalTemplateString(question.helpText),
    inputType,
    placeholder: optionalTemplateString(question.placeholder),
    maxLength: optionalTemplateStringOrNumber(question.maxLength),
    minValue: optionalTemplateStringOrNumber(question.minValue),
    maxValue: optionalTemplateStringOrNumber(question.maxValue),
    stepValue: optionalTemplateStringOrNumber(question.stepValue),
    validation: normalizeTemplateValidation(question.validation),
    required: optionalTemplateBoolean(question.required, true),
    isActive: optionalTemplateBoolean(question.isActive, true),
    options: parseTemplateOptions(question.options, `${field}.options`),
  };
}

function normalizeQuestionValidation(
  question: Pick<SurveyQuestion, "inputType" | "validation">,
) {
  if (question.inputType !== "TEXT") {
    return {};
  }

  const inputFilter = getTextInputFilter(question.validation);

  return inputFilter === "NONE" ? {} : { inputFilter };
}

function normalizeTemplateValidation(value: unknown) {
  const inputFilter = getTextInputFilter(value);

  return inputFilter === "NONE"
    ? {}
    : ({ inputFilter } satisfies { inputFilter: TextInputFilter });
}

function parseTemplateOptions(value: unknown, field: string): SurveyQuestion["options"] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }

  return value.map((optionValue, index) => {
    const option = requireTemplateObject(optionValue, `${field}[${index}]`);
    const label = requiredTemplateString(option.label, `${field}[${index}].label`);

    return {
      label,
      value: optionalTemplateString(option.value) || slugify(label),
      score: optionalTemplateInteger(option.score, 0),
      sortOrder: index,
      isActive: optionalTemplateBoolean(option.isActive, true),
    };
  });
}

function parseTemplateInputType(value: unknown, field: string): InputType {
  if (typeof value !== "string" || !inputTypes.includes(value as InputType)) {
    throw new Error(`${field} must be a valid input type`);
  }

  return value as InputType;
}

function requireTemplateObject(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }

  return value as Record<string, unknown>;
}

function requiredTemplateString(value: unknown, field: string) {
  const text = optionalTemplateString(value);

  if (!text) {
    throw new Error(`${field} is required`);
  }

  return text;
}

function optionalTemplateString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalTemplateStringOrNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "";
}

function optionalTemplateBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function optionalTemplateInteger(value: unknown, fallback: number) {
  if (value === null || value === undefined || value === "") {
    return String(fallback);
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) ? String(numberValue) : String(fallback);
}

function toPayloadOptions(
  options: SurveyQuestion["options"],
  clearIds: boolean,
) {
  return options.map((option, optionIndex) => {
    const fallbackValue = slugify(option.label) || `option-${optionIndex + 1}`;

    return {
      id: clearIds ? undefined : option.id,
      label: option.label,
      value: fallbackValue,
      score: option.score === "" ? 0 : Number(option.score),
      sortOrder: optionIndex,
      isActive: option.isActive,
    };
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
