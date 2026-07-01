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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
            <Select
              value={question.inputType}
              onValueChange={(value) =>
                onUpdateQuestion(
                  question.clientId,
                  questionTypePatch(question, value as InputType),
                )
              }
            >
              <SelectTrigger
                id={`${question.clientId}-type`}
                className="h-9 w-full bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {inputTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {typeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
