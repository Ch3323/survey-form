"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SurveyQuestion, SurveyResponse } from "../_lib/types";
import { SubmissionDetailCard } from "./submission-detail-card";
import { SubmissionList } from "./submission-list";

type SubmissionViewProps = {
  clearingResponses: boolean;
  deletingResponseId: string;
  responses: SurveyResponse[];
  selectedResponse?: SurveyResponse;
  selectedResponseId: string;
  surveyId?: string;
  surveyQuestions: SurveyQuestion[];
  onClearResponses: () => void;
  onDeleteResponse: (responseId: string) => void;
  onSelectResponse: (responseId: string) => void;
};

export function SubmissionView({
  clearingResponses,
  deletingResponseId,
  responses,
  selectedResponse,
  selectedResponseId,
  surveyId,
  surveyQuestions,
  onClearResponses,
  onDeleteResponse,
  onSelectResponse,
}: SubmissionViewProps) {
  if (responses.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No submissions yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <SubmissionList
        clearingResponses={clearingResponses}
        responses={responses}
        selectedResponseId={selectedResponseId}
        surveyId={surveyId}
        surveyQuestions={surveyQuestions}
        onClearResponses={onClearResponses}
        onSelectResponse={onSelectResponse}
      />
      <SubmissionDetailCard
        deletingResponseId={deletingResponseId}
        selectedResponse={selectedResponse}
        onDeleteResponse={onDeleteResponse}
      />
    </div>
  );
}
