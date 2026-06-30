"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminSidebar } from "./_components/admin-sidebar";
import { DashboardHeader } from "./_components/dashboard-header";
import { EditForm } from "./_components/edit-form";
import { SubmissionView } from "./_components/submission-view";
import {
  addQuestionToSection,
  emptySurveyForm,
  errorMessage,
  groupQuestionsIntoSections,
  readJsonResponse,
  surveyToForm,
  surveyToPayload,
} from "./_lib/survey-form-utils";
import {
  type AdminSurveyListItem,
  type AdminTab,
  type InputType,
  type LoadedSurvey,
  type SectionMeta,
  type SurveyForm,
  type SurveyOption,
  type SurveyQuestion,
  type SurveyResponse,
} from "./_lib/types";

type AdminDashboardProps = {
  adminName: string;
};

export function AdminDashboard({ adminName }: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("edit");
  const [survey, setSurvey] = useState<SurveyForm>(() => emptySurveyForm());
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [selectedResponseId, setSelectedResponseId] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<InputType>("RATING");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingResponseId, setDeletingResponseId] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const selectedResponse = useMemo(
    () => responses.find((response) => response.id === selectedResponseId),
    [responses, selectedResponseId],
  );

  const stats = useMemo(() => {
    const activeQuestions = survey.questions.filter(
      (question) => question.isActive,
    );
    const sections = groupQuestionsIntoSections(
      activeQuestions,
      survey.sections,
    );

    return {
      questions: activeQuestions.length,
      pages: sections.length,
      sections: sections.length,
      responses: responses.length,
    };
  }, [responses.length, survey.questions, survey.sections]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const listData = await readJsonResponse<{ surveys: AdminSurveyListItem[] }>(
        await fetch("/api/admin/surveys", { cache: "no-store" }),
      );
      const firstSurvey = listData.surveys[0];

      if (!firstSurvey) {
        setSurvey(emptySurveyForm());
        setResponses([]);
        setSelectedResponseId("");
        return;
      }

      const surveyData = await readJsonResponse<{ survey: LoadedSurvey }>(
        await fetch(`/api/admin/surveys/${firstSurvey.id}`, {
          cache: "no-store",
        }),
      );
      const responseData = await readJsonResponse<{
        responses: SurveyResponse[];
      }>(
        await fetch(`/api/admin/surveys/${firstSurvey.id}/responses`, {
          cache: "no-store",
        }),
      );

      setSurvey(surveyToForm(surveyData.survey));
      setResponses(responseData.responses);
      setSelectedResponseId(responseData.responses[0]?.id ?? "");
    } catch (caught) {
      toast.error(errorMessage(caught, "Unable to load dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(() => {
      if (active) {
        void loadDashboard();
      }
    });

    return () => {
      active = false;
    };
  }, [loadDashboard]);

  function addQuestion(sectionId?: string) {
    setSurvey((current) => ({
      ...current,
      questions: addQuestionToSection(
        current.questions,
        current.sections,
        newQuestionType,
        sectionId,
      ),
    }));
  }

  function addSection() {
    setSurvey((current) => {
      const sections = groupQuestionsIntoSections(
        current.questions,
        current.sections,
      );
      const section: SectionMeta = {
        id: crypto.randomUUID(),
        title: `Section ${sections.length + 1}`,
        description: "",
        order: sections.length,
      };

      return {
        ...current,
        sections: [...current.sections, section],
      };
    });
  }

  function updateSection(sectionId: string, patch: Partial<SectionMeta>) {
    setSurvey((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
      questions: current.questions.map((question) =>
        question.sectionId === sectionId
          ? {
              ...question,
              sectionTitle: patch.title ?? question.sectionTitle,
              sectionDescription:
                patch.description ?? question.sectionDescription,
              sectionOrder: patch.order ?? question.sectionOrder,
              pageNumber:
                patch.order === undefined ? question.pageNumber : patch.order + 1,
            }
          : question,
      ),
    }));
  }

  function removeSection(sectionId: string) {
    setSurvey((current) => {
      if (current.sections.length <= 1) {
        return current;
      }

      const sections = current.sections
        .filter((section) => section.id !== sectionId)
        .sort((sectionA, sectionB) => sectionA.order - sectionB.order)
        .map((section, order) => ({ ...section, order }));
      const sectionById = new Map(
        sections.map((section) => [section.id, section]),
      );

      return {
        ...current,
        sections,
        questions: current.questions
          .filter((question) => question.sectionId !== sectionId)
          .map((question) => {
            const section = sectionById.get(question.sectionId);

            if (!section) {
              return question;
            }

            return {
              ...question,
              sectionTitle: section.title,
              sectionDescription: section.description,
              sectionOrder: section.order,
              pageNumber: section.order + 1,
            };
          }),
      };
    });
  }

  function updateQuestion(clientId: string, patch: Partial<SurveyQuestion>) {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.clientId === clientId ? { ...question, ...patch } : question,
      ),
    }));
  }

  function updateOption(
    questionClientId: string,
    optionIndex: number,
    patch: Partial<SurveyOption>,
  ) {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.clientId !== questionClientId) {
          return question;
        }

        return {
          ...question,
          options: question.options.map((option, index) =>
            index === optionIndex ? { ...option, ...patch } : option,
          ),
        };
      }),
    }));
  }

  function addOption(questionClientId: string) {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.clientId !== questionClientId) {
          return question;
        }

        const nextIndex = question.options.length + 1;

        return {
          ...question,
          options: [
            ...question.options,
            {
              label: `Option ${nextIndex}`,
              value: `option-${nextIndex}`,
              sortOrder: question.options.length,
              isActive: true,
            },
          ],
        };
      }),
    }));
  }

  function removeOption(questionClientId: string, optionIndex: number) {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.map((question) => {
        if (question.clientId !== questionClientId) {
          return question;
        }

        return {
          ...question,
          options: question.options.filter((_, index) => index !== optionIndex),
        };
      }),
    }));
  }

  function removeQuestion(clientId: string) {
    setSurvey((current) => ({
      ...current,
      questions: current.questions.filter(
        (question) => question.clientId !== clientId,
      ),
    }));
  }

  function moveQuestion(clientId: string, direction: -1 | 1) {
    setSurvey((current) => {
      const index = current.questions.findIndex(
        (question) => question.clientId === clientId,
      );
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.questions.length) {
        return current;
      }

      const questions = [...current.questions];
      const [question] = questions.splice(index, 1);
      questions.splice(nextIndex, 0, question);

      return { ...current, questions };
    });
  }

  async function saveSurvey() {
    setSaving(true);

    try {
      const payload = surveyToPayload(survey);
      const endpoint = survey.id
        ? `/api/admin/surveys/${survey.id}`
        : "/api/admin/surveys";
      const method = survey.id ? "PATCH" : "POST";
      const data = await readJsonResponse<{ survey: LoadedSurvey }>(
        await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      );

      setSurvey(surveyToForm(data.survey));
      toast.success("Survey saved");
      await refreshResponses(data.survey.id);
    } catch (caught) {
      toast.error(errorMessage(caught, "Unable to save survey"));
    } finally {
      setSaving(false);
    }
  }

  async function refreshResponses(surveyId = survey.id) {
    if (!surveyId) {
      setResponses([]);
      setSelectedResponseId("");
      return;
    }

    const data = await readJsonResponse<{ responses: SurveyResponse[] }>(
      await fetch(`/api/admin/surveys/${surveyId}/responses`, {
        cache: "no-store",
      }),
    );
    setResponses(data.responses);
    setSelectedResponseId((current) => current || data.responses[0]?.id || "");
  }

  async function deleteResponse(responseId: string) {
    setDeletingResponseId(responseId);

    try {
      const response = await fetch(`/api/admin/responses/${responseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        await readJsonResponse(response);
      }

      setResponses((current) => {
        const next = current.filter((item) => item.id !== responseId);
        setSelectedResponseId(next[0]?.id ?? "");
        return next;
      });
      toast.success("Submission deleted");
    } catch (caught) {
      toast.error(errorMessage(caught, "Unable to delete submission"));
    } finally {
      setDeletingResponseId("");
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        activeTab={activeTab}
        adminName={adminName}
        signingOut={signingOut}
        onSelectTab={setActiveTab}
        onSignOut={handleSignOut}
      />

      <SidebarInset>
        <main className="min-w-0 bg-cloud-page px-4 py-5 text-cloud-text sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
            <DashboardHeader
              title={activeTab === "edit" ? "Edit form" : "View submission"}
              stats={stats}
            />

            {loading ? (
              <Card className="rounded-xl">
                <CardContent className="flex items-center justify-center py-8">
                  <Spinner className="size-6 text-primary" />
                </CardContent>
              </Card>
            ) : activeTab === "edit" ? (
              <EditForm
                newQuestionType={newQuestionType}
                saving={saving}
                survey={survey}
                onAddOption={addOption}
                onAddQuestion={addQuestion}
                onAddSection={addSection}
                onMoveQuestion={moveQuestion}
                onRemoveOption={removeOption}
                onRemoveQuestion={removeQuestion}
                onRemoveSection={removeSection}
                onSave={saveSurvey}
                onSetNewQuestionType={setNewQuestionType}
                onSetSurvey={setSurvey}
                onUpdateOption={updateOption}
                onUpdateQuestion={updateQuestion}
                onUpdateSection={updateSection}
              />
            ) : (
              <SubmissionView
                deletingResponseId={deletingResponseId}
                responses={responses}
                selectedResponse={selectedResponse}
                selectedResponseId={selectedResponseId}
                onDeleteResponse={deleteResponse}
                onSelectResponse={setSelectedResponseId}
              />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
