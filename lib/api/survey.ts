import { Prisma } from "@/lib/generated/prisma/client";
import {
  SurveyQuestionInputType,
  SurveyStatus,
  type SurveyQuestionInputType as SurveyQuestionInputTypeValue,
  type SurveyStatus as SurveyStatusValue,
} from "@/lib/generated/prisma/enums";

export const surveyInclude = {
  questions: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" as const },
    include: {
      options: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" as const },
      },
    },
  },
};

export const publicSurveyInclude = {
  questions: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" as const },
    include: {
      options: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" as const },
      },
    },
  },
};

export const responseInclude = {
  survey: {
    select: {
      id: true,
      slug: true,
      title: true,
    },
  },
  answers: {
    orderBy: { createdAt: "asc" as const },
    include: {
      question: {
        select: {
          id: true,
          sortOrder: true,
        },
      },
      selectedOptions: {
        include: {
          option: {
            select: {
              id: true,
              label: true,
              value: true,
            },
          },
        },
      },
    },
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function jsonOk(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof Response) {
    return error;
  }

  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (error.code === "P2002") {
      const target = isRecord(error.meta) ? error.meta.target : undefined;
      const fields = Array.isArray(target)
        ? target.filter((item) => typeof item === "string").join(", ")
        : "";

      return Response.json(
        {
          error: fields
            ? `A record with this unique value already exists: ${fields}`
            : "A record with this unique value already exists",
        },
        { status: 409 },
      );
    }
  }

  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}

export function requireObject(value: unknown, label = "body") {
  if (!isRecord(value) || Array.isArray(value)) {
    throw new ApiError(400, `${label} must be an object`);
  }

  return value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function optionalString(value: unknown, field: string, max?: number) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be a string`);
  }

  const trimmed = value.trim();

  if (max && trimmed.length > max) {
    throw new ApiError(400, `${field} must be at most ${max} characters`);
  }

  return trimmed;
}

export function requiredString(value: unknown, field: string, max?: number) {
  const text = optionalString(value, field, max);

  if (!text) {
    throw new ApiError(400, `${field} is required`);
  }

  return text;
}

export function optionalNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new ApiError(400, `${field} must be a number`);
  }

  return numberValue;
}

export function optionalInteger(value: unknown, field: string) {
  const numberValue = optionalNumber(value, field);

  if (numberValue === undefined) {
    return undefined;
  }

  if (!Number.isInteger(numberValue)) {
    throw new ApiError(400, `${field} must be an integer`);
  }

  return numberValue;
}

export function optionalBoolean(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new ApiError(400, `${field} must be a boolean`);
  }

  return value;
}

export function optionalJson(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

export function parseStatus(value: unknown, fallback?: SurveyStatusValue) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (value === "INACTIVE") {
    return SurveyStatus.DRAFT;
  }

  if (
    typeof value !== "string" ||
    !Object.values(SurveyStatus).includes(value as SurveyStatusValue)
  ) {
    throw new ApiError(400, "status is invalid");
  }

  return value as SurveyStatusValue;
}

export function parseInputType(
  value: unknown,
  fallback = SurveyQuestionInputType.TEXT,
) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (
    typeof value !== "string" ||
    !Object.values(SurveyQuestionInputType).includes(
      value as SurveyQuestionInputTypeValue,
    )
  ) {
    throw new ApiError(400, "inputType is invalid");
  }

  return value as SurveyQuestionInputTypeValue;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function serialize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isDecimal(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => serialize(item));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)]),
    );
  }

  return value;
}

function isDecimal(value: unknown) {
  return (
    isRecord(value) &&
    "toDecimalPlaces" in value &&
    typeof value.toString === "function"
  );
}
