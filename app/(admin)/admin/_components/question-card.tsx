"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
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
    <Card className="rounded-lg border-border/80 shadow-sm">
      <CardHeader className="border-b bg-card px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span>Question {index + 1}</span>
              <Badge variant="outline">{typeLabel(question.inputType)}</Badge>
            </CardTitle>
            <CardDescription>{sectionTitle}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move question up"
              onClick={() => onMoveQuestion(question.clientId, -1)}
              disabled={index === 0}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move question down"
              onClick={() => onMoveQuestion(question.clientId, 1)}
              disabled={index === totalQuestions - 1}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete question"
              onClick={() => onRemoveQuestion(question.clientId)}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 px-4">
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

        <div className="grid gap-2">
          <Label htmlFor={`${question.clientId}-help-text`}>Help text</Label>
          <Textarea
            id={`${question.clientId}-help-text`}
            value={question.helpText}
            className="min-h-9 h-9 scrollbar-none scroll-smooth"
            placeholder="Optional helper text shown below the question"
            rows={2}
            onChange={(event) =>
              onUpdateQuestion(question.clientId, {
                helpText: event.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-4">
          <QuestionTypeSettings
            question={question}
            onAddOption={onAddOption}
            onRemoveOption={onRemoveOption}
            onUpdateOption={onUpdateOption}
            onUpdateQuestion={onUpdateQuestion}
          />

          <div className="flex w-fit self-end items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
            <Checkbox
              id={`${question.clientId}-required`}
              checked={question.required}
              onCheckedChange={(checked) =>
                onUpdateQuestion(question.clientId, {
                  required: checked === true,
                })
              }
            />
            <Label htmlFor={`${question.clientId}-required`}>Required</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
