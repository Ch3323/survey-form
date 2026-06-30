"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getRatingOptions,
  inputTypeToHtmlType,
  optionalNumber,
} from "../_lib/survey-utils";
import type { AnswerValue, SurveyQuestion } from "../_lib/types";
import { ChoiceButton } from "./choice-button";

type QuestionInputProps = {
  answer: AnswerValue | undefined;
  question: SurveyQuestion;
  onUpdateAnswer: (
    questionId: string,
    value: AnswerValue | undefined,
  ) => void;
};

export function QuestionInput({
  answer,
  question,
  onUpdateAnswer,
}: QuestionInputProps) {
  switch (question.inputType) {
    case "RATING":
      return (
        <div className="grid gap-2">
          <div className="grid grid-cols-5 gap-2">
            {getRatingOptions().map((option) => {
              const selected = answer === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  aria-pressed={selected}
                  onClick={() => onUpdateAnswer(question.id, option.value)}
                >
                  {option.value}
                </Button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{"\u0e19\u0e49\u0e2d\u0e22"}</span>
            <span>{"\u0e21\u0e32\u0e01"}</span>
          </div>
        </div>
      );
    case "TEXTAREA":
      return (
        <Textarea
          minLength={0}
          maxLength={optionalNumber(question.maxLength)}
          placeholder={question.placeholder ?? undefined}
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => onUpdateAnswer(question.id, event.target.value)}
        />
      );
    case "BOOLEAN":
      return (
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((value) => (
            <Button
              key={String(value)}
              type="button"
              variant={answer === value ? "default" : "outline"}
              onClick={() => onUpdateAnswer(question.id, value)}
            >
              {value ? "Yes" : "No"}
            </Button>
          ))}
        </div>
      );
    case "SINGLE_CHOICE":
      return (
        <div className="grid gap-2">
          {question.options.map((option) => (
            <ChoiceButton
              key={option.id}
              selected={answer === option.id}
              label={option.label}
              onClick={() => onUpdateAnswer(question.id, option.id)}
            />
          ))}
        </div>
      );
    case "MULTIPLE_CHOICE":
      return (
        <div className="grid gap-2">
          {question.options.map((option) => {
            const selectedAnswers = Array.isArray(answer) ? answer : [];
            const selected = selectedAnswers.includes(option.id);

            return (
              <ChoiceButton
                key={option.id}
                selected={selected}
                label={option.label}
                onClick={() => {
                  onUpdateAnswer(
                    question.id,
                    selected
                      ? selectedAnswers.filter((id) => id !== option.id)
                      : [...selectedAnswers, option.id],
                  );
                }}
              />
            );
          })}
        </div>
      );
    case "NUMBER":
      return (
        <Input
          type="number"
          min={optionalNumber(question.minValue)}
          max={optionalNumber(question.maxValue)}
          step={optionalNumber(question.stepValue)}
          placeholder={question.placeholder ?? undefined}
          value={
            typeof answer === "string" || typeof answer === "number"
              ? answer
              : ""
          }
          onChange={(event) => onUpdateAnswer(question.id, event.target.value)}
        />
      );
    case "DATE":
      return (
        <Input
          type="date"
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => onUpdateAnswer(question.id, event.target.value)}
        />
      );
    case "EMAIL":
    case "URL":
    case "TEXT":
    default:
      return (
        <div className="grid gap-2">
          <Label className="sr-only" htmlFor={question.id}>
            {question.title}
          </Label>
          <Input
            id={question.id}
            type={inputTypeToHtmlType(question.inputType)}
            maxLength={optionalNumber(question.maxLength)}
            placeholder={question.placeholder ?? undefined}
            value={typeof answer === "string" ? answer : ""}
            onChange={(event) =>
              onUpdateAnswer(question.id, event.target.value)
            }
          />
        </div>
      );
  }
}
