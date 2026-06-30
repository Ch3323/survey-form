"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import {
  groupQuestionsIntoSections,
  typeLabel,
} from "../_lib/survey-form-utils";
import {
  inputTypes,
  type InputType,
  type SectionMeta,
  type SurveyForm,
  type SurveyOption,
  type SurveyQuestion,
} from "../_lib/types";
import { SectionCard } from "./section-card";

type EditFormProps = {
  newQuestionType: InputType;
  saving: boolean;
  survey: SurveyForm;
  onAddOption: (questionClientId: string) => void;
  onAddQuestion: (sectionId?: string) => void;
  onAddSection: () => void;
  onMoveQuestion: (clientId: string, direction: -1 | 1) => void;
  onRemoveOption: (questionClientId: string, optionIndex: number) => void;
  onRemoveQuestion: (clientId: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onSave: () => void;
  onSetNewQuestionType: (type: InputType) => void;
  onSetSurvey: Dispatch<SetStateAction<SurveyForm>>;
  onUpdateOption: (
    questionClientId: string,
    optionIndex: number,
    patch: Partial<SurveyOption>,
  ) => void;
  onUpdateQuestion: (clientId: string, patch: Partial<SurveyQuestion>) => void;
  onUpdateSection: (sectionId: string, patch: Partial<SectionMeta>) => void;
};

export function EditForm({
  newQuestionType,
  saving,
  survey,
  onAddOption,
  onAddQuestion,
  onAddSection,
  onMoveQuestion,
  onRemoveOption,
  onRemoveQuestion,
  onRemoveSection,
  onSave,
  onSetNewQuestionType,
  onSetSurvey,
  onUpdateOption,
  onUpdateQuestion,
  onUpdateSection,
}: EditFormProps) {
  const sections = groupQuestionsIntoSections(
    survey.questions,
    survey.sections,
  );

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-cloud-panel)] sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="survey-title">Title</Label>
          <Input
            id="survey-title"
            value={survey.title}
            onChange={(event) =>
              onSetSurvey((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="survey-status">Status</Label>
          <select
            id="survey-status"
            className="h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
            value={survey.status}
            onChange={(event) =>
              onSetSurvey((current) => ({
                ...current,
                status: event.target.value as SurveyForm["status"],
              }))
            }
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="survey-description">Description</Label>
          <Textarea
            id="survey-description"
            value={survey.description}
            onChange={(event) =>
              onSetSurvey((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-cloud-panel)] sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-full gap-2 sm:max-w-xs">
          <Label htmlFor="new-question-type">Question type</Label>
          <select
            id="new-question-type"
            className="h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
            value={newQuestionType}
            onChange={(event) =>
              onSetNewQuestionType(event.target.value as InputType)
            }
          >
            {inputTypes.map((type) => (
              <option key={type} value={type}>
                {typeLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={onAddSection}>
          <Plus />
          Add section
        </Button>
      </section>

      <div className="grid gap-4">
        {sections.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="py-8 text-sm text-muted-foreground">
              No sections yet.
            </CardContent>
          </Card>
        ) : null}

        {sections.map((section, sectionIndex) => (
          <SectionCard
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            totalQuestions={survey.questions.length}
            totalSections={sections.length}
            allQuestions={survey.questions}
            onAddOption={onAddOption}
            onAddQuestion={onAddQuestion}
            onMoveQuestion={onMoveQuestion}
            onRemoveOption={onRemoveOption}
            onRemoveQuestion={onRemoveQuestion}
            onRemoveSection={onRemoveSection}
            onUpdateOption={onUpdateOption}
            onUpdateQuestion={onUpdateQuestion}
            onUpdateSection={onUpdateSection}
          />
        ))}
      </div>

      <div className="sticky bottom-0 flex justify-end border-t border-border bg-cloud-page/90 p-4 backdrop-blur">
        <Button type="button" size="lg" onClick={onSave} disabled={saving}>
          {saving ? <Spinner /> : <Save />}
          Save survey
        </Button>
      </div>
    </div>
  );
}
