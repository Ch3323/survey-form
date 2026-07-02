const DEFAULT_INTERVAL_SECONDS = 60 * 60;
const DEFAULT_TARGET_URL =
  "http://web:3000/api/cron/cleanup-inactive-survey-data";

const intervalSeconds = readPositiveInteger(
  process.env.CRON_INTERVAL_SECONDS,
  DEFAULT_INTERVAL_SECONDS,
);
const targetUrl = process.env.CRON_TARGET_URL || DEFAULT_TARGET_URL;
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret) {
  console.error("CRON_SECRET is required for the Docker cron runner.");
  process.exit(1);
}

async function runCron() {
  const startedAt = new Date();

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${cronSecret}`,
      },
    });
    const body = await response.text();

    if (!response.ok) {
      console.error(
        `[cron] ${startedAt.toISOString()} failed with ${response.status}: ${body}`,
      );
      return;
    }

    console.log(`[cron] ${startedAt.toISOString()} ok: ${body}`);
  } catch (error) {
    console.error(`[cron] ${startedAt.toISOString()} request failed`, error);
  }
}

function readPositiveInteger(value, fallback) {
  if (!value) {
    return fallback;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0
    ? numberValue
    : fallback;
}

await runCron();
setInterval(runCron, intervalSeconds * 1000);
