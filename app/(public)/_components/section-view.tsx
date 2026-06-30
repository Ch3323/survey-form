"use client";

import type { AnswerValue, Answers, PageGroup } from "../_lib/types";
import { QuestionCard } from "./question-card";

type SectionViewProps = {
  answers: Answers;
  page: PageGroup;
  pageIndex: number;
  onUpdateAnswer: (
    questionId: string,
    value: AnswerValue | undefined,
  ) => void;
};

export function SectionView({
  answers,
  page,
  pageIndex,
  onUpdateAnswer,
}: SectionViewProps) {
  return (
    <div className="grid gap-5">
      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-cloud-panel)]">
        <p className="text-sm font-semibold text-primary">
          Section {pageIndex + 1}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-cloud-heading">
          {page.title || `Section ${pageIndex + 1}`}
        </h2>
        {page.description ? (
          <p className="mt-2 text-sm leading-6 text-cloud-muted">
            {page.description}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3">
        {page.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            answer={answers[question.id]}
            index={index}
            question={question}
            onUpdateAnswer={onUpdateAnswer}
          />
        ))}
      </section>
    </div>
  );
}
