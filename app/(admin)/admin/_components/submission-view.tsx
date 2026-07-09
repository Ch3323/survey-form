"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { SurveyQuestion, SurveyResponse } from "../_lib/types";
import { SubmissionDetailCard } from "./submission-detail-card";
import { SubmissionList } from "./submission-list";
import { SubmissionOverview } from "./submission-overview";

type SubmissionViewProps = {
  clearingResponses: boolean;
  deletingResponseId: string;
  loadingResponses: boolean;
  responses: SurveyResponse[];
  responsesError: string;
  selectedResponse?: SurveyResponse;
  selectedResponseId: string;
  surveyId?: string;
  surveyQuestions: SurveyQuestion[];
  onClearResponses: () => void;
  onDeleteResponse: (responseId: string) => void;
  onReloadResponses: () => void;
  onSelectResponse: (responseId: string) => void;
};

export function SubmissionView({
  clearingResponses,
  deletingResponseId,
  loadingResponses,
  responses,
  responsesError,
  selectedResponse,
  selectedResponseId,
  surveyId,
  surveyQuestions,
  onClearResponses,
  onDeleteResponse,
  onReloadResponses,
  onSelectResponse,
}: SubmissionViewProps) {
  if (loadingResponses) {
    return (
      <Card className="rounded-xl">
        <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading submissions...
        </CardContent>
      </Card>
    );
  }

  if (responsesError) {
    return (
      <Card className="rounded-xl">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
          <p>{responsesError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReloadResponses}
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <SubmissionOverview
          responses={responses}
        />
        <Card className="rounded-xl">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No submissions yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SubmissionOverview
        responses={responses}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
        <div className="min-w-0">
          <SubmissionList
            clearingResponses={clearingResponses}
            responses={responses}
            selectedResponseId={selectedResponseId}
            surveyId={surveyId}
            surveyQuestions={surveyQuestions}
            onClearResponses={onClearResponses}
            onSelectResponse={onSelectResponse}
          />
        </div>
        <SubmissionDetailCard
          className="lg:sticky lg:top-5"
          deletingResponseId={deletingResponseId}
          selectedResponse={selectedResponse}
          onDeleteResponse={onDeleteResponse}
        />
      </div>
    </div>
  );
}
