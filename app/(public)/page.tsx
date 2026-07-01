"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageShell } from "./_components/page-shell";
import { ProgressCard } from "./_components/progress-card";
import { SectionView } from "./_components/section-view";
import { SurveyHeader } from "./_components/survey-header";
import { SurveyNavigation } from "./_components/survey-navigation";
import {
  SurveyLoading,
  SurveySubmitted,
  SurveyUnavailable,
} from "./_components/survey-state-cards";
import {
  errorMessage,
  firstPageNumber,
  groupQuestionsByPage,
  questionHasValue,
  readJsonResponse,
  toPayloadAnswer,
} from "./_lib/survey-utils";
import {
  clearSurveyDraft,
  readSurveyDraft,
  writeSurveyDraft,
} from "./_lib/survey-draft";
import type { AnswerValue, Answers, LoadedSurvey } from "./_lib/types";
import { toast } from "sonner";

export default function Page() {
  const [survey, setSurvey] = useState<LoadedSurvey | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [responseId, setResponseId] = useState("");
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSurvey = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const data = await readJsonResponse<{ survey: LoadedSurvey }>(
        await fetch("/api/surveys/current", { cache: "no-store" }),
      );

      const draft = readSurveyDraft(data.survey);

      setSurvey(data.survey);
      setAnswers(draft?.answers ?? {});
      setCurrentPage(
        draft?.currentPage ?? firstPageNumber(data.survey.questions),
      );
      setSubmitted(false);
      setResponseId("");
      setAverageScore(null);
    } catch (caught) {
      const message = errorMessage(caught, "Unable to load survey");

      setSurvey(null);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (active) {
        void loadSurvey();
      }
    });

    return () => {
      active = false;
    };
  }, [loadSurvey]);

  useEffect(() => {
    if (!survey || loading || submitted) {
      return;
    }

    writeSurveyDraft(survey, answers, currentPage);
  }, [answers, currentPage, loading, submitted, survey]);

  const pageGroups = useMemo(
    () => (survey ? groupQuestionsByPage(survey.questions) : []),
    [survey],
  );
  const currentPageIndex = pageGroups.findIndex(
    (page) => page.pageNumber === currentPage,
  );
  const currentPageGroup =
    currentPageIndex >= 0 ? pageGroups[currentPageIndex] : pageGroups[0];
  const requiredQuestions =
    survey?.questions.filter((question) => question.required) ?? [];
  const answeredRequired = requiredQuestions.filter((question) =>
    questionHasValue(question, answers[question.id]),
  ).length;
  const progress =
    requiredQuestions.length > 0
      ? Math.round((answeredRequired / requiredQuestions.length) * 100)
      : 100;
  const canSubmit =
    survey !== null &&
    requiredQuestions.every((question) =>
      questionHasValue(question, answers[question.id]),
    );
  const isLastPage = currentPageIndex === pageGroups.length - 1;
  const isFirstPage = currentPageIndex <= 0;

  function updateAnswer(questionId: string, value: AnswerValue | undefined) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function goToPreviousPage() {
    const previousPage = pageGroups[currentPageIndex - 1];

    if (previousPage) {
      setCurrentPage(previousPage.pageNumber);
    }
  }

  function goToNextPage() {
    const nextPage = pageGroups[currentPageIndex + 1];

    if (nextPage) {
      setCurrentPage(nextPage.pageNumber);
    }
  }

  async function handleSubmit() {
    if (!survey || !canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      const payloadAnswers = survey.questions
        .map((question) => toPayloadAnswer(question, answers[question.id]))
        .filter(Boolean);

      const data = await readJsonResponse<{
        response?: {
          id?: string;
          averageScore?: string | number;
        };
      }>(
        await fetch(`/api/surveys/${encodeURIComponent(survey.slug)}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payloadAnswers }),
        }),
      );

      setResponseId(data.response?.id ?? "");
      setAverageScore(
        data.response?.averageScore === undefined
          ? null
          : Number(data.response.averageScore),
      );
      clearSurveyDraft(survey.id);
      setSubmitted(true);
    } catch (caught) {
      toast.error(errorMessage(caught, "Unable to submit survey"));
    } finally {
      setSubmitting(false);
    }
  }

  function resetSurvey() {
    if (survey) {
      clearSurveyDraft(survey.id);
    }

    setAnswers({});
    setCurrentPage(pageGroups[0]?.pageNumber ?? 1);
    setSubmitted(false);
    setResponseId("");
    setAverageScore(null);
  }

  if (loading) {
    return <SurveyLoading />;
  }

  if (loadError || !survey || survey.questions.length === 0) {
    return (
      <SurveyUnavailable
        message={loadError || "The active survey has no questions yet."}
        onReload={loadSurvey}
      />
    );
  }

  if (submitted) {
    return (
      <SurveySubmitted
        averageScore={averageScore}
        responseId={responseId}
        onReset={resetSurvey}
      />
    );
  }

  return (
    <PageShell>
      <SurveyHeader survey={survey} />
      <ProgressCard
        currentPageIndex={currentPageIndex}
        pageCount={pageGroups.length}
        progress={progress}
      />

      {currentPageGroup ? (
        <SectionView
          answers={answers}
          page={currentPageGroup}
          pageIndex={currentPageIndex}
          onUpdateAnswer={updateAnswer}
        />
      ) : null}

      <SurveyNavigation
        canSubmit={canSubmit}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        submitting={submitting}
        onBack={goToPreviousPage}
        onNext={goToNextPage}
        onSubmit={handleSubmit}
      />
    </PageShell>
  );
}
