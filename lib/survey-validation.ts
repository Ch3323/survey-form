export const textInputFilters = ["NONE", "DIGITS_ONLY"] as const;

export type TextInputFilter = (typeof textInputFilters)[number];

export type QuestionValidation = {
  inputFilter?: TextInputFilter;
};

export const textInputFilterLabels: Record<TextInputFilter, string> = {
  NONE: "No filter",
  DIGITS_ONLY: "Numbers only",
};

export function toQuestionValidation(value: unknown): QuestionValidation {
  if (!isRecord(value)) {
    return {};
  }

  const inputFilter = value.inputFilter;

  return {
    inputFilter:
      typeof inputFilter === "string" &&
      textInputFilters.includes(inputFilter as TextInputFilter)
        ? (inputFilter as TextInputFilter)
        : undefined,
  };
}

export function getTextInputFilter(value: unknown): TextInputFilter {
  return toQuestionValidation(value).inputFilter ?? "NONE";
}

export function applyTextInputFilter(value: string, validation: unknown) {
  if (getTextInputFilter(validation) === "DIGITS_ONLY") {
    return value.replace(/\D/g, "");
  }

  return value;
}

export function textInputFilterIsValid(value: string, validation: unknown) {
  if (getTextInputFilter(validation) === "DIGITS_ONLY") {
    return /^\d*$/.test(value);
  }

  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
