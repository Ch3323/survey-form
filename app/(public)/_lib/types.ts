export const defaultRatingOptions = [
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
];

export type InputType =
  | "RATING"
  | "TEXT"
  | "TEXTAREA"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "BOOLEAN"
  | "NUMBER"
  | "DATE"
  | "EMAIL"
  | "URL";

export type SurveyQuestion = {
  id: string;
  title: string;
  helpText?: string | null;
  inputType: InputType;
  required: boolean;
  placeholder?: string | null;
  maxLength?: number | string | null;
  minValue?: number | string | null;
  maxValue?: number | string | null;
  stepValue?: number | string | null;
  settings?: unknown;
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
};

export type LoadedSurvey = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  questions: SurveyQuestion[];
};

export type AnswerValue = string | number | boolean | string[];
export type Answers = Record<string, AnswerValue | undefined>;

export type PageGroup = {
  pageNumber: number;
  title: string;
  description: string;
  questions: SurveyQuestion[];
};
