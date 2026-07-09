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
import { cn } from "@/lib/utils";
import { ClipboardList, Trash2 } from "lucide-react";
import type { SurveyResponse } from "../_lib/types";
import {
  assessmentLevelLabel,
  formatAnswer,
  formatScore,
  typeLabel,
} from "../_lib/survey-form-utils";
import { Stat } from "./stat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SubmissionDetailCardProps = {
  className?: string;
  deletingResponseId: string;
  selectedResponse?: SurveyResponse;
  onDeleteResponse: (responseId: string) => void;
};

export function SubmissionDetailCard({
  className,
  deletingResponseId,
  selectedResponse,
  onDeleteResponse,
}: SubmissionDetailCardProps) {
  return (
    <Card
      className={cn(
        "flex max-h-none min-h-0 flex-col overflow-hidden rounded-xl lg:max-h-[calc(100vh-2.5rem)]",
        className,
      )}
    >
      <CardHeader className="shrink-0 border-b bg-card">
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
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pt-4">
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
    <div className="grid shrink-0 grid-cols-2 gap-3">
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
    </div>
  );
}

function SubmissionAnswerList({ response }: { response: SurveyResponse }) {
  return (
    <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 scroll-smooth">
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={deleting}
        >
          {deleting ? <Spinner /> : <Trash2 />}
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete submissions?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this submission and answers. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? <Spinner /> : <Trash2 />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
