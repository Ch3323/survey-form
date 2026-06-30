"use client";

import { Stat } from "./stat";

type DashboardHeaderProps = {
  title: string;
  stats: {
    questions: number;
    pages: number;
    sections: number;
    responses: number;
  };
};

export function DashboardHeader({ title, stats }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-cloud-header)] xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Admin dashboard
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-cloud-heading">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat label="Questions" value={stats.questions} />
        <Stat label="Sections" value={stats.sections} />
        <Stat label="Responses" value={stats.responses} />
      </div>
    </header>
  );
}
