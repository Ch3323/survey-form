"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
  questionTypePatch,
  typeLabel,
} from "../_lib/survey-form-utils";
import { inputTypes, type InputType, type SurveyOption, type SurveyQuestion } from "../_lib/types";
import { QuestionTypeSettings } from "./question-type-settings";

type QuestionCardProps = {
  index: number;
  question: SurveyQuestion;
  sectionTitle: string;
  totalQuestions: number;
  onAddOption: (questionClientId: string) => void;
  onMoveQuestion: (clientId: string, direction: -1 | 1) => void;
  onRemoveOption: (questionClientId: string, optionIndex: number) => void;
  onRemoveQuestion: (clientId: string) => void;
  onUpdateOption: (
    questionClientId: string,
    optionIndex: number,
    patch: Partial<SurveyOption>,
  ) => void;
  onUpdateQuestion: (clientId: string, patch: Partial<SurveyQuestion>) => void;
};

export function QuestionCard({
  index,
  question,
  sectionTitle,
  totalQuestions,
  onAddOption,
  onMoveQuestion,
  onRemoveOption,
  onRemoveQuestion,
  onUpdateOption,
  onUpdateQuestion,
}: QuestionCardProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="border-b bg-card">
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>Question {index + 1}</span>
          <Badge variant="outline">{typeLabel(question.inputType)}</Badge>
        </CardTitle>
        <CardDescription>{sectionTitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        <div className="grid gap-4 md:grid-cols-[1fr_190px]">
          <div className="grid gap-2">
            <Label htmlFor={`${question.clientId}-title`}>Question</Label>
            <Input
              id={`${question.clientId}-title`}
              value={question.title}
              onChange={(event) =>
                onUpdateQuestion(question.clientId, {
                  title: event.target.value,
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${question.clientId}-type`}>Type</Label>
            <select
              id={`${question.clientId}-type`}
              className="h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
              value={question.inputType}
              onChange={(event) =>
                onUpdateQuestion(
                  question.clientId,
                  questionTypePatch(question, event.target.value as InputType),
                )
              }
            >
              {inputTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <QuestionTypeSettings
          question={question}
          onAddOption={onAddOption}
          onRemoveOption={onRemoveOption}
          onUpdateOption={onUpdateOption}
          onUpdateQuestion={onUpdateQuestion}
        />

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(event) =>
                onUpdateQuestion(question.clientId, {
                  required: event.target.checked,
                })
              }
            />
            Required
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Move question up"
              onClick={() => onMoveQuestion(question.clientId, -1)}
              disabled={index === 0}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Move question down"
              onClick={() => onMoveQuestion(question.clientId, 1)}
              disabled={index === totalQuestions - 1}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => onRemoveQuestion(question.clientId)}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
