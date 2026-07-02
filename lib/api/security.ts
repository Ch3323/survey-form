import { ApiError } from "@/lib/api/survey";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const DEFAULT_MAX_JSON_BYTES = 128 * 1024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const rateLimitBuckets = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

export function assertJsonRequest(
  request: Request,
  maxBytes = DEFAULT_MAX_JSON_BYTES,
) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "Content-Type must be application/json");
  }

  assertContentLength(request, maxBytes);
}

export function assertContentLength(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return;
  }

  const size = Number(contentLength);

  if (!Number.isFinite(size) || size < 0) {
    throw new ApiError(400, "Content-Length is invalid");
  }

  if (size > maxBytes) {
    throw new ApiError(413, "Request body is too large");
  }
}

export function enforceRateLimit(
  request: Request,
  { key, limit, windowMs }: RateLimitOptions,
) {
  const now = Date.now();
  const bucketKey = `${key}:${clientAddress(request)}`;
  const bucket = rateLimitBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    throw new ApiError(429, "Too many requests", { retryAfter });
  }
}

export function requireUuid(value: string, field = "id") {
  if (!UUID_PATTERN.test(value)) {
    throw new ApiError(400, `${field} must be a valid UUID`);
  }

  return value;
}

export function optionalUuid(value: string | undefined, field = "id") {
  if (value === undefined) {
    return undefined;
  }

  return requireUuid(value, field);
}

function clientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
