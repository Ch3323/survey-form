"use client";

import { Button } from "@/components/ui/button";
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
import {
  getTextInputFilter,
  textInputFilterLabels,
  textInputFilters,
  type TextInputFilter,
} from "@/lib/survey-validation";
import { Plus, Trash2 } from "lucide-react";
import {
  getRatingOptions,
  textPlaceholder,
} from "../_lib/survey-form-utils";
import type { SurveyOption, SurveyQuestion } from "../_lib/types";

type QuestionTypeSettingsProps = {
  question: SurveyQuestion;
  onAddOption: (questionClientId: string) => void;
  onRemoveOption: (questionClientId: string, optionIndex: number) => void;
  onUpdateOption: (
    questionClientId: string,
    optionIndex: number,
    patch: Partial<SurveyOption>,
  ) => void;
  onUpdateQuestion: (clientId: string, patch: Partial<SurveyQuestion>) => void;
};

export function QuestionTypeSettings({
  question,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onUpdateQuestion,
}: QuestionTypeSettingsProps) {
  const updateQuestion = (patch: Partial<SurveyQuestion>) => {
    onUpdateQuestion(question.clientId, patch);
  };

  switch (question.inputType) {
    case "RATING":
      return (
        <div className="grid gap-4 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="grid gap-2">
            <Label>Rating scale</Label>
            <div className="grid grid-cols-5 gap-2">
              {getRatingOptions().map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  className="pointer-events-none"
                  aria-label={`Rating ${option.value}`}
                >
                  {option.value}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>น้อย</span>
              <span>มาก</span>
            </div>
          </div>
        </div>
      );
    case "TEXT":
    case "EMAIL":
    case "URL":
      return (
        <div className="grid gap-4 rounded-xl border border-border bg-secondary/40 p-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`${question.clientId}-placeholder`}>
              Placeholder
            </Label>
            <Input
              id={`${question.clientId}-placeholder`}
              value={question.placeholder}
              placeholder={textPlaceholder(question.inputType)}
              onChange={(event) =>
                updateQuestion({ placeholder: event.target.value })
              }
            />
          </div>
          {question.inputType === "TEXT" ? (
            <div className="grid gap-2">
              <Label htmlFor={`${question.clientId}-input-filter`}>
                Input filter
              </Label>
              <Select
                value={getTextInputFilter(question.validation)}
                onValueChange={(value) =>
                  updateQuestion({
                    validation:
                      value === "NONE"
                        ? {}
                        : { inputFilter: value as TextInputFilter },
                  })
                }
              >
                <SelectTrigger
                  id={`${question.clientId}-input-filter`}
                  className="h-9 w-full bg-card"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {textInputFilters.map((filter) => (
                    <SelectItem key={filter} value={filter}>
                      {textInputFilterLabels[filter]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor={`${question.clientId}-max-length`}>
              Max length
            </Label>
            <Input
              id={`${question.clientId}-max-length`}
              type="number"
              min={1}
              value={question.maxLength}
              placeholder="Optional"
              onChange={(event) =>
                updateQuestion({ maxLength: event.target.value })
              }
            />
          </div>
        </div>
      );
    case "TEXTAREA":
      return (
        <div className="grid gap-4 rounded-xl border border-border bg-secondary/40 p-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`${question.clientId}-placeholder`}>
              Placeholder
            </Label>
            <Textarea
              id={`${question.clientId}-placeholder`}
              value={question.placeholder}
              placeholder="Long answer hint"
              onChange={(event) =>
                updateQuestion({ placeholder: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${question.clientId}-max-length`}>
              Max length
            </Label>
            <Input
              id={`${question.clientId}-max-length`}
              type="number"
              min={1}
              value={question.maxLength}
              placeholder="Optional"
              onChange={(event) =>
                updateQuestion({ maxLength: event.target.value })
              }
            />
          </div>
        </div>
      );
    case "NUMBER":
      return (
        <div className="grid gap-4 rounded-xl border border-border bg-secondary/40 p-3 md:grid-cols-4">
          <div className="grid gap-2 md:col-span-4">
            <Label htmlFor={`${question.clientId}-placeholder`}>
              Placeholder
            </Label>
            <Input
              id={`${question.clientId}-placeholder`}
              value={question.placeholder}
              placeholder="Example: 10"
              onChange={(event) =>
                updateQuestion({ placeholder: event.target.value })
              }
            />
          </div>
          <NumberSetting
            label="Min"
            value={question.minValue}
            onChange={(value) => updateQuestion({ minValue: value })}
          />
          <NumberSetting
            label="Max"
            value={question.maxValue}
            onChange={(value) => updateQuestion({ maxValue: value })}
          />
          <NumberSetting
            label="Step"
            value={question.stepValue}
            onChange={(value) => updateQuestion({ stepValue: value })}
          />
        </div>
      );
    case "BOOLEAN":
      return (
        <div className="grid gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <Label>Answer buttons</Label>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((value) => (
              <Button
                key={String(value)}
                type="button"
                variant="outline"
                className="pointer-events-none"
              >
                {value ? "Yes" : "No"}
              </Button>
            ))}
          </div>
        </div>
      );
    case "SINGLE_CHOICE":
    case "MULTIPLE_CHOICE":
      return (
        <div className="grid gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <Label>
              {question.inputType === "SINGLE_CHOICE"
                ? "Single choice options"
                : "Multiple choice options"}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddOption(question.clientId)}
            >
              <Plus />
              Add option
            </Button>
          </div>
          <div className="grid gap-2">
            {question.options.map((option, optionIndex) => (
              <div
                key={`${option.id ?? "new"}-${optionIndex}`}
                className="grid gap-2 sm:grid-cols-[1fr_auto]"
              >
                <div className="grid gap-1.5">
                  <Input
                    id={`${question.clientId}-${optionIndex}-label`}
                    aria-label={`Option ${optionIndex + 1} display text`}
                    value={option.label}
                    onChange={(event) =>
                      onUpdateOption(question.clientId, optionIndex, {
                        label: event.target.value,
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove option"
                  className="sm:self-end"
                  onClick={() => onRemoveOption(question.clientId, optionIndex)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    case "DATE":
      return (
        <div className="grid gap-3 rounded-xl border border-border bg-secondary/40 p-3">
          <Label>Input preview</Label>
          <Input type="date" disabled />
        </div>
      );
  }
}

function NumberSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        placeholder="Optional"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
