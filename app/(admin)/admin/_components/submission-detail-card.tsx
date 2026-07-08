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
import { Spinner } from "@/components/ui/spinner";
import { ClipboardList, Trash2 } from "lucide-react";
import type { SurveyResponse } from "../_lib/types";
import {
  assessmentLevelLabel,
  formatAnswer,
  formatScore,
  typeLabel,
} from "../_lib/survey-form-utils";
import { Stat } from "./stat";

type SubmissionDetailCardProps = {
  deletingResponseId: string;
  selectedResponse?: SurveyResponse;
  onDeleteResponse: (responseId: string) => void;
};

export function SubmissionDetailCard({
  deletingResponseId,
  selectedResponse,
  onDeleteResponse,
}: SubmissionDetailCardProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-4" />
          Submission detail
        </CardTitle>
        <CardDescription>
          {selectedResponse
            ? new Date(selectedResponse.submittedAt).toLocaleString()
            : "Select a submission"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        {selectedResponse ? (
          <>
            <SubmissionScoreSummary response={selectedResponse} />
            <SubmissionAnswerList response={selectedResponse} />
            <DeleteSubmissionAction
              deleting={deletingResponseId === selectedResponse.id}
              onDelete={() => onDeleteResponse(selectedResponse.id)}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SubmissionScoreSummary({ response }: { response: SurveyResponse }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat
        label="Level"
        value={assessmentLevelLabel(response.assessmentLevel)}
      />
      <Stat
        label="Correctness"
        value={`${Number(response.correctnessPercentage).toFixed(1)}%`}
      />
      <Stat label="Total score" value={formatScore(response.totalScore)} />
      <Stat label="Max score" value={formatScore(response.maxScore)} />
      <Stat label="Average" value={Number(response.averageScore).toFixed(1)} />
    </div>
  );
}

function SubmissionAnswerList({ response }: { response: SurveyResponse }) {
  return (
    <div className="grid gap-3">
      {response.answers.map((answer) => (
        <div
          key={answer.id}
          className="rounded-xl border border-border bg-secondary/30 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{answer.questionTitleSnapshot}</p>
            <Badge variant="secondary">
              {typeLabel(answer.questionInputType)}
            </Badge>
            {answer.score !== null && answer.score !== undefined ? (
              <Badge variant="outline">Score {formatScore(answer.score)}</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatAnswer(answer)}
          </p>
        </div>
      ))}
    </div>
  );
}

function DeleteSubmissionAction({
  deleting,
  onDelete,
}: {
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end border-t border-border pt-4">
      <Button
        type="button"
        variant="destructive"
        onClick={onDelete}
        disabled={deleting}
      >
        {deleting ? <Spinner /> : <Trash2 />}
        Delete submission
      </Button>
    </div>
  );
}
