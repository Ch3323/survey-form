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

type AssessmentLevel = "BEGINNER" | "ADVANCED";

type ValidationTarget = {
  attempt: number;
  questionId: string;
};

type PageNavigationTarget = {
  attempt: number;
  pageNumber: number;
};

export default function Page() {
  const [survey, setSurvey] = useState<LoadedSurvey | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [validationTarget, setValidationTarget] =
    useState<ValidationTarget | null>(null);
  const [pageNavigationTarget, setPageNavigationTarget] =
    useState<PageNavigationTarget | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [responseId, setResponseId] = useState("");
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [correctnessPercentage, setCorrectnessPercentage] = useState<
    number | null
  >(null);
  const [assessmentLevel, setAssessmentLevel] =
    useState<AssessmentLevel | null>(null);
  const [recommendedAssessmentLevel, setRecommendedAssessmentLevel] =
    useState<AssessmentLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [choosingRoom, setChoosingRoom] = useState(false);

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
      setCorrectnessPercentage(null);
      setAssessmentLevel(null);
      setRecommendedAssessmentLevel(null);
      setChoosingRoom(false);
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
  const isLastPage = currentPageIndex === pageGroups.length - 1;
  const isFirstPage = currentPageIndex <= 0;
  const invalidQuestionId = validationTarget?.questionId ?? null;

  useEffect(() => {
    if (!validationTarget || !currentPageGroup) {
      return;
    }

    const questionIsVisible = currentPageGroup.questions.some(
      (question) => question.id === validationTarget.questionId,
    );

    if (!questionIsVisible) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const questionElement = document.getElementById(
        `question-${validationTarget.questionId}`,
      );

      questionElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      const focusableElement = questionElement?.querySelector<HTMLElement>(
        "input, textarea, button, select",
      );

      (focusableElement ?? questionElement)?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentPageGroup, validationTarget]);

  useEffect(() => {
    if (!pageNavigationTarget || !currentPageGroup) {
      return;
    }

    if (currentPageGroup.pageNumber !== pageNavigationTarget.pageNumber) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentPageGroup, pageNavigationTarget]);

  function updateAnswer(questionId: string, value: AnswerValue | undefined) {
    setAnswers((current) => ({ ...current, [questionId]: value }));

    if (validationTarget?.questionId === questionId && survey) {
      const question = survey.questions.find((item) => item.id === questionId);

      if (question && questionHasValue(question, value)) {
        setValidationTarget(null);
      }
    }
  }

  function goToPreviousPage() {
    const previousPage = pageGroups[currentPageIndex - 1];

    if (previousPage) {
      setCurrentPage(previousPage.pageNumber);
      setPageNavigationTarget((current) => ({
        attempt: (current?.attempt ?? 0) + 1,
        pageNumber: previousPage.pageNumber,
      }));
    }
  }

  function goToNextPage() {
    const nextPage = pageGroups[currentPageIndex + 1];

    if (nextPage) {
      setCurrentPage(nextPage.pageNumber);
      setPageNavigationTarget((current) => ({
        attempt: (current?.attempt ?? 0) + 1,
        pageNumber: nextPage.pageNumber,
      }));
    }
  }

  async function handleSubmit() {
    if (!survey) {
      return;
    }

    const firstMissingQuestion = requiredQuestions.find(
      (question) => !questionHasValue(question, answers[question.id]),
    );

    if (firstMissingQuestion) {
      const targetPage = pageGroups.find((page) =>
        page.questions.some((question) => question.id === firstMissingQuestion.id),
      );

      if (targetPage) {
        setCurrentPage(targetPage.pageNumber);
      }

      setValidationTarget((current) => ({
        attempt: (current?.attempt ?? 0) + 1,
        questionId: firstMissingQuestion.id,
      }));
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบก่อนส่งแบบฟอร์ม");
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
          correctnessPercentage?: string | number;
          assessmentLevel?: AssessmentLevel;
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
      setCorrectnessPercentage(
        data.response?.correctnessPercentage === undefined
          ? null
          : Number(data.response.correctnessPercentage),
      );
      const submittedAssessmentLevel = data.response?.assessmentLevel ?? null;

      setAssessmentLevel(submittedAssessmentLevel);
      setRecommendedAssessmentLevel(submittedAssessmentLevel);
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
    setCorrectnessPercentage(null);
    setAssessmentLevel(null);
    setRecommendedAssessmentLevel(null);
    setChoosingRoom(false);
  }

  function chooseRoom(nextAssessmentLevel: AssessmentLevel) {
    setAssessmentLevel(nextAssessmentLevel);
  }

  async function submitRoomChoiceAndReset() {
    if (!assessmentLevel || !responseId) {
      resetSurvey();
      return;
    }

    if (assessmentLevel === recommendedAssessmentLevel) {
      resetSurvey();
      return;
    }

    const selectedAssessmentLevel = assessmentLevel;

    setChoosingRoom(true);

    try {
      const data = await readJsonResponse<{
        response?: {
          assessmentLevel?: AssessmentLevel;
        };
      }>(
        await fetch(
          `/api/responses/${encodeURIComponent(responseId)}/assessment-level`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assessmentLevel: selectedAssessmentLevel }),
          },
        ),
      );

      setAssessmentLevel(
        data.response?.assessmentLevel ?? selectedAssessmentLevel,
      );
      toast.success("Room choice saved");
      resetSurvey();
    } catch (caught) {
      toast.error(errorMessage(caught, "Unable to save room choice"));
    } finally {
      setChoosingRoom(false);
    }
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
        recommendedAssessmentLevel={recommendedAssessmentLevel}
        selectedAssessmentLevel={assessmentLevel}
        averageScore={averageScore}
        correctnessPercentage={correctnessPercentage}
        choosingRoom={choosingRoom}
        responseId={responseId}
        onChooseRoom={chooseRoom}
        onSubmitRoomChoice={submitRoomChoiceAndReset}
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
          invalidQuestionId={invalidQuestionId}
          page={currentPageGroup}
          pageIndex={currentPageIndex}
          onUpdateAnswer={updateAnswer}
        />
      ) : null}

      <SurveyNavigation
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
