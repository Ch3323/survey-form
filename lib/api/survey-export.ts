import type { SurveyQuestionInputType } from "@/lib/generated/prisma/enums";

type ExportQuestion = {
  id: string;
  title: string;
  sortOrder: number;
};

type ExportAnswer = {
  questionId: string;
  questionTitleSnapshot: string;
  questionInputType: SurveyQuestionInputType;
  score: number | null;
  textValue: string | null;
  booleanValue: boolean | null;
  numberValue: { toString(): string } | string | number | null;
  dateValue: Date | string | null;
  selectedOptions: Array<{
    option: {
      label: string;
      value: string;
    };
  }>;
};

type ExportResponse = {
  id: string;
  anonymousKey: string | null;
  totalScore: number;
  averageScore: { toString(): string } | string | number;
  submittedAt: Date | string;
  answers: ExportAnswer[];
};

export type SurveyResponsesExport = {
  slug: string;
  title: string;
  questions: ExportQuestion[];
  responses: ExportResponse[];
};

type ExportColumn = {
  key: string;
  title: string;
  value: (response: ExportResponse) => string;
};

export function buildSurveyResponsesExcel(
  survey: SurveyResponsesExport,
  columnKeys?: string[],
) {
  const questionColumns = buildQuestionColumns(survey);
  const columns = resolveExportColumns(survey, questionColumns, columnKeys);
  const rows = survey.responses.map((response) => {
    const answersByQuestion = new Map(
      response.answers.map((answer) => [answer.questionId, answer]),
    );

    return columns.map((column) =>
      column.key.startsWith("q:")
        ? formatAnswer(answersByQuestion.get(column.key.slice(2)))
        : column.value(response),
    );
  });

  return buildSpreadsheetXml({
    sheetName: safeSheetName(survey.title || "Submissions"),
    rows: [columns.map((column) => column.title), ...rows],
  });
}

export function parseExportColumnKeys(searchParams: URLSearchParams) {
  const keys = searchParams
    .getAll("column")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return keys.length > 0 ? keys : undefined;
}

export function surveyResponsesExcelFilename(slug: string) {
  const date = new Date().toISOString().slice(0, 10);
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "survey";

  return `${safeSlug}-submissions-${date}.xls`;
}

function resolveExportColumns(
  survey: SurveyResponsesExport,
  questionColumns: ExportColumn[],
  columnKeys?: string[],
) {
  const columns = [
    ...metadataColumns(),
    ...questionColumns,
  ];

  if (!columnKeys) {
    return columns;
  }

  const byKey = new Map(columns.map((column) => [column.key, column]));
  const seenKeys = new Set<string>();
  const selectedColumns = columnKeys.flatMap((key) => {
    const column = byKey.get(key);

    if (!column || seenKeys.has(key)) {
      return [];
    }

    seenKeys.add(key);
    return [column];
  });

  return selectedColumns.length > 0 ? selectedColumns : columns;
}

function metadataColumns(): ExportColumn[] {
  return [
    {
      key: "submittedAt",
      title: "Submitted at",
      value: (response) => formatDateTime(response.submittedAt),
    },
    {
      key: "responseId",
      title: "Response ID",
      value: (response) => response.id,
    },
    {
      key: "anonymousKey",
      title: "Anonymous key",
      value: (response) => response.anonymousKey ?? "",
    },
    {
      key: "totalScore",
      title: "Total score",
      value: (response) => String(response.totalScore),
    },
    {
      key: "averageScore",
      title: "Average score",
      value: (response) => String(response.averageScore),
    },
  ];
}

function buildQuestionColumns(survey: SurveyResponsesExport) {
  const columns = new Map<string, ExportColumn>();

  for (const question of [...survey.questions].sort(sortQuestions)) {
    columns.set(`q:${question.id}`, {
      key: `q:${question.id}`,
      title: question.title,
      value: () => "",
    });
  }

  for (const response of survey.responses) {
    for (const answer of response.answers) {
      const key = `q:${answer.questionId}`;

      if (!columns.has(key)) {
        columns.set(key, {
          key,
          title: answer.questionTitleSnapshot,
          value: () => "",
        });
      }
    }
  }

  return [...columns.values()];
}

function sortQuestions(questionA: ExportQuestion, questionB: ExportQuestion) {
  if (questionA.sortOrder !== questionB.sortOrder) {
    return questionA.sortOrder - questionB.sortOrder;
  }

  return questionA.title.localeCompare(questionB.title);
}

function formatAnswer(answer: ExportAnswer | undefined) {
  if (!answer) {
    return "";
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
    return formatDate(answer.dateValue);
  }

  if (answer.selectedOptions.length > 0) {
    return answer.selectedOptions.map((item) => item.option.label).join(", ");
  }

  return "";
}

function buildSpreadsheetXml({
  sheetName,
  rows,
}: {
  sheetName: string;
  rows: string[][];
}) {
  const tableRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map(
            (cell) =>
              `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`,
          )
          .join("")}</Row>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>${tableRows}</Table>
  </Worksheet>
</Workbook>`;
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString().slice(0, 10);
}

function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString().replace("T", " ").slice(0, 19);
}

function safeSheetName(value: string) {
  return (
    value
      .replace(/[:\\/?*[\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 31) || "Submissions"
  );
}

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
