export const inputTypes = [
  "RATING",
  "TEXT",
  "TEXTAREA",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "BOOLEAN",
  "NUMBER",
  "DATE",
  "EMAIL",
  "URL",
] as const;

export const defaultRatingOptions = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
];

export type InputType = (typeof inputTypes)[number];
export type AdminTab = "edit" | "submissions";

export type SectionMeta = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type SurveyOption = {
  id?: string;
  label: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
};

export type SurveyQuestion = {
  id?: string;
  clientId: string;
  title: string;
  helpText: string;
  inputType: InputType;
  sortOrder: number;
  placeholder: string;
  maxLength: string;
  minValue: string;
  maxValue: string;
  stepValue: string;
  required: boolean;
  isActive: boolean;
  sectionId: string;
  sectionTitle: string;
  sectionDescription: string;
  sectionOrder: number;
  pageNumber: number;
  settings: Record<string, unknown>;
  options: SurveyOption[];
};

export type SurveySection = SectionMeta & {
  questions: SurveyQuestion[];
};

export type SurveyForm = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  sections: SectionMeta[];
  questions: SurveyQuestion[];
};

export type LoadedSurvey = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: SurveyForm["status"];
  questions: Array<{
    id: string;
    title: string;
    helpText?: string | null;
    inputType: InputType;
    sortOrder: number;
    placeholder?: string | null;
    maxLength?: number | string | null;
    minValue?: number | string | null;
    maxValue?: number | string | null;
    stepValue?: number | string | null;
    required: boolean;
    isActive: boolean;
    settings?: unknown;
    options: Array<{
      id: string;
      label: string;
      value: string;
      sortOrder: number;
      isActive: boolean;
    }>;
  }>;
};

export type AdminSurveyListItem = {
  id: string;
  slug: string;
  title: string;
  status: SurveyForm["status"];
  _count?: {
    questions: number;
    responses: number;
  };
};

export type SurveyResponse = {
  id: string;
  totalScore: number | string;
  averageScore: number | string;
  submittedAt: string;
  answers: Array<{
    id: string;
    questionTitleSnapshot: string;
    questionInputType: InputType;
    score?: number | null;
    textValue?: string | null;
    booleanValue?: boolean | null;
    numberValue?: string | number | null;
    dateValue?: string | null;
    selectedOptions: Array<{
      option: {
        label: string;
        value: string;
      };
    }>;
  }>;
};
