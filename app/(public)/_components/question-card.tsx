"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnswerValue, SurveyQuestion } from "../_lib/types";
import { QuestionInput } from "./question-input";

type QuestionCardProps = {
  answer: AnswerValue | undefined;
  index: number;
  question: SurveyQuestion;
  onUpdateAnswer: (
    questionId: string,
    value: AnswerValue | undefined,
  ) => void;
};

export function QuestionCard({
  answer,
  index,
  question,
  onUpdateAnswer,
}: QuestionCardProps) {
  return (
    <Card className="relative rounded-xl">
      {question.required ? (
        <span
          aria-label="Required question"
          className="absolute right-4 top-3 text-lg font-normal leading-none text-destructive select-none"
        >
          *
        </span>
      ) : null}
      <CardHeader className="pr-10">
        <CardTitle className="flex items-start gap-3 text-base">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm text-primary">
            {index + 1}
          </span>
          <span>{question.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <QuestionInput
          answer={answer}
          question={question}
          onUpdateAnswer={onUpdateAnswer}
        />
      </CardContent>
    </Card>
  );
}
