"use client";

import {
  BarChart3,
  CheckCircle2,
  RotateCcw,
  Send,
  Target,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const scores = [1, 2, 3, 4, 5];

type SurveySummary = {
  slug: string;
};

type SurveyQuestion = {
  id: string;
  title: string;
  inputType: string;
  required: boolean;
  helpText?: string | null;
};

type LoadedSurvey = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  questions: SurveyQuestion[];
};

type Answers = Record<string, number>;
type TextAnswers = Record<string, string>;

export default function Page() {
  const [survey, setSurvey] = useState<LoadedSurvey | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [textAnswers, setTextAnswers] = useState<TextAnswers>({});
  const [submitted, setSubmitted] = useState(false);
  const [responseId, setResponseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadSurvey = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const surveysResponse = await fetch("/api/surveys", {
        cache: "no-store",
      });
      const surveysData = await readJsonResponse<{ surveys: SurveySummary[] }>(
        surveysResponse,
      );
      const activeSurvey = surveysData.surveys[0];

      if (!activeSurvey) {
        throw new Error("ยังไม่มีแบบประเมินที่เปิดใช้งาน");
      }

      const surveyResponse = await fetch(
        `/api/surveys/${encodeURIComponent(activeSurvey.slug)}/questions`,
        { cache: "no-store" },
      );
      const surveyData = await readJsonResponse<{ survey: LoadedSurvey }>(
        surveyResponse,
      );

      setSurvey(surveyData.survey);
      setAnswers({});
      setTextAnswers({});
      setSubmitted(false);
      setResponseId("");
      setSubmitError("");
    } catch (error) {
      setSurvey(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : "โหลดแบบประเมินไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSurvey();
  }, [loadSurvey]);

  const ratingQuestions = useMemo(
    () =>
      survey?.questions.filter((question) => question.inputType === "RATING") ??
      [],
    [survey],
  );
  const textQuestions = useMemo(
    () =>
      survey?.questions.filter((question) =>
        ["TEXT", "TEXTAREA"].includes(question.inputType),
      ) ?? [],
    [survey],
  );

  const answeredCount = ratingQuestions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  const completedTextCount = textQuestions.filter(
    (question) => textAnswers[question.id]?.trim(),
  ).length;
  const requiredTextQuestions = textQuestions.filter(
    (question) => question.required,
  );
  const totalSteps = ratingQuestions.length + requiredTextQuestions.length;
  const completedSteps = answeredCount + completedTextCount;
  const progress =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const canSubmit =
    survey !== null &&
    ratingQuestions.length > 0 &&
    answeredCount === ratingQuestions.length &&
    requiredTextQuestions.every((question) => textAnswers[question.id]?.trim());

  const result = useMemo(() => {
    const values = ratingQuestions.map((question) => answers[question.id] ?? 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    const average = values.length ? total / values.length : 0;
    const lowestScore = values.length ? Math.min(...values) : 0;
    const strongestScore = values.length ? Math.max(...values) : 0;
    const focusAreas = ratingQuestions.filter(
      (question) => answers[question.id] === lowestScore,
    );
    const strengths = ratingQuestions.filter(
      (question) => answers[question.id] === strongestScore,
    );

    return {
      average,
      total,
      totalPossible: values.length * 5,
      focusAreas: focusAreas.slice(0, 2),
      strengths: strengths.slice(0, 2),
      level:
        average >= 4.4
          ? "มั่นใจมาก"
          : average >= 3.4
            ? "กำลังไปได้ดี"
            : average >= 2.4
              ? "ควรทบทวนเป็นจุด"
              : "เริ่มวางพื้นฐานใหม่",
    };
  }, [answers, ratingQuestions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !survey) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payloadAnswers: Array<{
        questionId: string;
        score?: number;
        value?: string;
      }> = [
        ...ratingQuestions.map((question) => ({
          questionId: question.id,
          score: answers[question.id],
        })),
        ...textQuestions
          .map((question) => ({
            questionId: question.id,
            value: textAnswers[question.id]?.trim() ?? "",
          }))
          .filter((answer) => answer.value),
      ];

      const response = await fetch(
        `/api/surveys/${encodeURIComponent(survey.slug)}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answers: payloadAnswers }),
        },
      );
      const data = await readJsonResponse<{
        response?: {
          id?: string;
        };
      }>(response);

      setResponseId(data.response?.id ?? "");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "ส่งคำตอบไม่สำเร็จ",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetSurvey() {
    setAnswers({});
    setTextAnswers({});
    setSubmitted(false);
    setResponseId("");
    setSubmitError("");
  }

  if (loading) {
    return (
      <PageShell>
        <header className="border-b border-cloud-border pb-5">
          <p className="text-sm font-medium text-cloud-muted">Coding Survey</p>
          <h1 className="mt-2 text-3xl font-semibold text-cloud-heading">
            กำลังโหลดแบบประเมิน
          </h1>
        </header>
        <section className="rounded-lg border border-cloud-border bg-cloud-surface p-5 shadow-[var(--shadow-cloud-panel)]">
          <div className="h-2 overflow-hidden rounded-full bg-cloud-muted-surface">
            <div className="h-full w-1/2 rounded-full bg-cloud-primary" />
          </div>
          <p className="mt-4 text-sm text-cloud-muted">
            กำลังดึงคำถามล่าสุดจากระบบ
          </p>
        </section>
      </PageShell>
    );
  }

  if (loadError || !survey || ratingQuestions.length === 0) {
    return (
      <PageShell>
        <header className="border-b border-cloud-border pb-5">
          <p className="text-sm font-medium text-cloud-muted">Coding Survey</p>
          <h1 className="mt-2 text-3xl font-semibold text-cloud-heading">
            เปิดแบบประเมินไม่ได้
          </h1>
        </header>
        <section className="rounded-lg border border-cloud-border bg-cloud-surface p-5 shadow-[var(--shadow-cloud-panel)]">
          <p className="text-sm text-cloud-muted">
            {loadError || "แบบประเมินนี้ยังไม่มีคำถามแบบให้คะแนน"}
          </p>
          <button
            type="button"
            onClick={loadSurvey}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cloud-border-strong bg-cloud-surface px-4 text-sm font-medium text-cloud-heading transition hover:bg-cloud-muted-surface focus-visible:ring-3 focus-visible:ring-cloud-primary-ring focus-visible:outline-none"
          >
            <RotateCcw className="size-4" />
            โหลดใหม่
          </button>
        </section>
      </PageShell>
    );
  }

  if (submitted) {
    return (
      <PageShell>
        <header className="border-b border-cloud-border pb-5">
          <p className="text-sm font-medium text-cloud-muted">Coding Survey</p>
          <h1 className="mt-2 text-3xl font-semibold text-cloud-heading">
            สรุปผลแบบประเมิน
          </h1>
          {responseId ? (
            <p className="mt-2 text-xs text-cloud-muted">Response: {responseId}</p>
          ) : null}
        </header>

        <section className="rounded-lg border border-cloud-border bg-cloud-surface p-5 shadow-[var(--shadow-cloud-panel)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-cloud-muted">
                คะแนนเฉลี่ย
              </p>
              <p className="mt-1 text-4xl font-semibold text-cloud-heading">
                {result.average.toFixed(1)}
              </p>
            </div>
            <div className="flex size-14 items-center justify-center rounded-lg bg-cloud-success-soft text-cloud-success">
              <CheckCircle2 className="size-7" />
            </div>
          </div>
          <div className="mt-5 h-2 rounded-full bg-cloud-muted-surface">
            <div
              className="h-full rounded-full bg-cloud-success"
              style={{ width: `${(result.average / 5) * 100}%` }}
            />
          </div>
          <p className="mt-4 text-lg font-semibold text-cloud-heading">
            {result.level}
          </p>
          <p className="mt-1 text-sm text-cloud-muted">
            รวม {result.total} จาก {result.totalPossible} คะแนน
          </p>
        </section>

        <section className="grid gap-4">
          <div className="rounded-lg border border-cloud-border bg-cloud-surface p-5">
            <div className="mb-3 flex items-center gap-2 text-cloud-heading">
              <BarChart3 className="size-4 text-cloud-primary-strong" />
              <h2 className="text-base font-semibold">จุดแข็ง</h2>
            </div>
            <ul className="space-y-2 text-sm text-cloud-muted">
              {result.strengths.map((question) => (
                <li key={question.id}>{question.title}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-cloud-border bg-cloud-surface p-5">
            <div className="mb-3 flex items-center gap-2 text-cloud-heading">
              <Target className="size-4 text-cloud-primary-strong" />
              <h2 className="text-base font-semibold">เป้าหมายถัดไป</h2>
            </div>
            <div className="space-y-3 text-sm text-cloud-muted">
              {textQuestions.map((question) => (
                <div key={question.id}>
                  <p className="font-medium text-cloud-heading">
                    {question.title}
                  </p>
                  <p className="mt-1">{textAnswers[question.id]?.trim()}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-cloud-border pt-4">
              <p className="text-sm font-medium text-cloud-heading">
                ควรโฟกัส
              </p>
              <ul className="mt-2 space-y-2 text-sm text-cloud-muted">
                {result.focusAreas.map((question) => (
                  <li key={question.id}>{question.title}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={resetSurvey}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-cloud-border-strong bg-cloud-surface px-4 text-sm font-medium text-cloud-heading transition hover:bg-cloud-muted-surface focus-visible:ring-3 focus-visible:ring-cloud-primary-ring focus-visible:outline-none"
        >
          <RotateCcw className="size-4" />
          ทำแบบประเมินอีกครั้ง
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="border-b border-cloud-border pb-5">
        <p className="text-sm font-medium text-cloud-muted">Coding Survey</p>
        <h1 className="mt-2 text-3xl font-semibold text-cloud-heading">
          {survey.title}
        </h1>
        {survey.description ? (
          <p className="mt-2 text-sm text-cloud-muted">{survey.description}</p>
        ) : null}
      </header>

      <section className="rounded-lg border border-cloud-border bg-cloud-surface p-4 shadow-[var(--shadow-cloud-header)]">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-cloud-heading">
            {completedSteps}/{totalSteps}
          </span>
          <span className="text-cloud-muted">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-cloud-muted-surface">
          <div
            className="h-full rounded-full bg-cloud-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {ratingQuestions.map((question, index) => (
          <section
            key={question.id}
            className="rounded-lg border border-cloud-border bg-cloud-surface p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-cloud-primary-soft text-sm font-semibold text-cloud-primary-strong">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-cloud-heading">
                  {question.title}
                </h2>
                {question.helpText ? (
                  <p className="mt-1 text-sm text-cloud-muted">
                    {question.helpText}
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {scores.map((score) => {
                    const selected = answers[question.id] === score;

                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: score,
                          }))
                        }
                        aria-pressed={selected}
                        className={[
                          "h-10 rounded-lg border text-sm font-semibold transition focus-visible:ring-3 focus-visible:ring-cloud-primary-ring focus-visible:outline-none",
                          selected
                            ? "border-cloud-primary bg-cloud-primary text-cloud-on-primary shadow-[var(--shadow-cloud-selected)]"
                            : "border-cloud-border bg-white text-cloud-heading hover:border-cloud-primary-border hover:bg-cloud-primary-soft-muted",
                        ].join(" ")}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ))}

        {textQuestions.map((question) => (
          <section
            key={question.id}
            className="rounded-lg border border-cloud-border bg-cloud-surface p-5"
          >
            <label className="flex flex-col gap-3">
              <span className="flex items-center gap-2 text-base font-semibold text-cloud-heading">
                <Target className="size-4 text-cloud-primary-strong" />
                {question.title}
              </span>
              <textarea
                value={textAnswers[question.id] ?? ""}
                onChange={(event) =>
                  setTextAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                className="min-h-28 resize-none rounded-lg border border-cloud-border bg-white px-3 py-3 text-sm text-cloud-text outline-none transition placeholder:text-cloud-muted focus:border-cloud-primary focus:ring-3 focus:ring-cloud-primary-ring"
                placeholder="เช่น อยากเขียน function ได้คล่องขึ้น"
                required={question.required}
              />
            </label>
          </section>
        ))}

        {submitError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cloud-primary px-5 text-sm font-semibold text-cloud-on-primary transition hover:bg-cloud-primary-strong focus-visible:ring-3 focus-visible:ring-cloud-primary-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-cloud-border-strong"
        >
          <Send className="size-4" />
          {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
        </button>
      </form>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-cloud-page px-4 py-8 text-cloud-text sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {children}
      </div>
    </main>
  );
}

async function readJsonResponse<T>(response: Response) {
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(data.error || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
  }

  return data;
}
