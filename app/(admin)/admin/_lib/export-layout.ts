import type { SurveyQuestion, SurveyResponse } from "./types";

export type ExportColumn = {
  key: string;
  label: string;
  enabled: boolean;
};

export type ExportLayout = {
  order: string[];
  disabledKeys: string[];
};

export function buildAvailableExportColumns(
  surveyQuestions: SurveyQuestion[],
  responses: SurveyResponse[],
): ExportColumn[] {
  const columns = new Map<string, ExportColumn>();

  for (const column of metadataExportColumns()) {
    columns.set(column.key, column);
  }

  for (const question of [...surveyQuestions]
    .filter((question) => question.isActive && question.id)
    .sort((questionA, questionB) => questionA.sortOrder - questionB.sortOrder)) {
    columns.set(`q:${question.id}`, {
      key: `q:${question.id}`,
      label: question.title,
      enabled: true,
    });
  }

  for (const response of responses) {
    for (const answer of response.answers) {
      const questionId = answer.questionId || answer.question?.id;

      if (!questionId) {
        continue;
      }

      const key = `q:${questionId}`;

      if (!columns.has(key)) {
        columns.set(key, {
          key,
          label: answer.questionTitleSnapshot,
          enabled: true,
        });
      }
    }
  }

  return [...columns.values()];
}

export function applyExportLayout(
  available: ExportColumn[],
  layout: ExportLayout,
) {
  const orderedKeys = orderedExportKeys(available, layout);
  const availableByKey = new Map(
    available.map((column) => [column.key, column]),
  );
  const disabledKeys = new Set(layout.disabledKeys);

  return orderedKeys.map((key) => {
    const column = availableByKey.get(key);

    return {
      ...column,
      enabled: !disabledKeys.has(key),
    } as ExportColumn;
  });
}

export function orderedExportKeys(
  available: ExportColumn[],
  layout: ExportLayout,
) {
  const availableByKey = new Map(
    available.map((column) => [column.key, column]),
  );

  return [
    ...layout.order.filter((key) => availableByKey.has(key)),
    ...available
      .map((column) => column.key)
      .filter((key) => !layout.order.includes(key)),
  ];
}

export function buildExportHref(surveyId: string, columnKeys: string[]) {
  const searchParams = new URLSearchParams();

  for (const columnKey of columnKeys) {
    searchParams.append("column", columnKey);
  }

  return `/api/admin/surveys/${surveyId}/responses/export?${searchParams.toString()}`;
}

function metadataExportColumns(): ExportColumn[] {
  return [
    { key: "submittedAt", label: "Submitted at", enabled: true },
    { key: "responseId", label: "Response ID", enabled: true },
    { key: "anonymousKey", label: "Anonymous key", enabled: true },
    { key: "totalScore", label: "Total score", enabled: true },
    { key: "averageScore", label: "Average score", enabled: true },
  ];
}
