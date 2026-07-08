"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { SectionMeta, SurveyOption, SurveyQuestion, SurveySection } from "../_lib/types";
import { QuestionCard } from "./question-card";

type SectionCardProps = {
  section: SurveySection;
  sectionIndex: number;
  totalQuestions: number;
  totalSections: number;
  allQuestions: SurveyQuestion[];
  onAddOption: (questionClientId: string) => void;
  onAddQuestion: (sectionId?: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onMoveQuestion: (clientId: string, direction: -1 | 1) => void;
  onRemoveOption: (questionClientId: string, optionIndex: number) => void;
  onRemoveQuestion: (clientId: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateOption: (
    questionClientId: string,
    optionIndex: number,
    patch: Partial<SurveyOption>,
  ) => void;
  onUpdateQuestion: (clientId: string, patch: Partial<SurveyQuestion>) => void;
  onUpdateSection: (sectionId: string, patch: Partial<SectionMeta>) => void;
};

export function SectionCard({
  section,
  sectionIndex,
  totalQuestions,
  totalSections,
  allQuestions,
  onAddOption,
  onAddQuestion,
  onMoveSection,
  onMoveQuestion,
  onRemoveOption,
  onRemoveQuestion,
  onRemoveSection,
  onUpdateOption,
  onUpdateQuestion,
  onUpdateSection,
}: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-[var(--shadow-cloud-panel)]">
      <div className="border-b border-border bg-secondary/30 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid min-w-0 flex-1 gap-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Section {sectionIndex + 1} of {totalSections}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {section.questions.length} questions
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Move section up"
                    disabled={sectionIndex === 0}
                    onClick={() => onMoveSection(section.id, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Move section down"
                    disabled={sectionIndex === totalSections - 1}
                    onClick={() => onMoveSection(section.id, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onAddQuestion(section.id)}
                >
                  <Plus />
                  Add question
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={totalSections <= 1}
                  onClick={() => onRemoveSection(section.id)}
                >
                  <Trash2 />
                  Delete
                </Button>
              </div>
            </div>
            <div className="grid gap-3 grid-cols-1">
              <div className="grid gap-2">
                <Label htmlFor={`${section.id}-title`}>Section title</Label>
                <Input
                  id={`${section.id}-title`}
                  value={section.title}
                  placeholder={`Section ${sectionIndex + 1}`}
                  onChange={(event) =>
                    onUpdateSection(section.id, {
                      title: event.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${section.id}-description`}>
                  Section description
                </Label>
                <Textarea
                  id={`${section.id}-description`}
                  value={section.description}
                  placeholder="Add a section description"
                  className="min-h-20 scrollbar-none"
                  onChange={(event) =>
                    onUpdateSection(section.id, {
                      description: event.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 p-4">
        {section.questions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-5 text-sm text-muted-foreground">
            No questions in this section yet.
          </div>
        ) : null}
        {section.questions.map((question) => {
          const index = allQuestions.findIndex(
            (item) => item.clientId === question.clientId,
          );

          return (
            <QuestionCard
              key={question.clientId}
              index={index}
              question={question}
              sectionTitle={section.title || `Section ${sectionIndex + 1}`}
              totalQuestions={totalQuestions}
              onAddOption={onAddOption}
              onMoveQuestion={onMoveQuestion}
              onRemoveOption={onRemoveOption}
              onRemoveQuestion={onRemoveQuestion}
              onUpdateOption={onUpdateOption}
              onUpdateQuestion={onUpdateQuestion}
            />
          );
        })}
      </div>
    </section>
  );
}
