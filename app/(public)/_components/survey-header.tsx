import type { LoadedSurvey } from "../_lib/types";

export function SurveyHeader({ survey }: { survey: LoadedSurvey }) {
  return (
    <header className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-cloud-header)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Self assessment
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-cloud-heading">
        {survey.title}
      </h1>
      {survey.description ? (
        <p className="mt-2 text-sm leading-6 text-cloud-muted">
          {survey.description}
        </p>
      ) : null}
    </header>
  );
}
