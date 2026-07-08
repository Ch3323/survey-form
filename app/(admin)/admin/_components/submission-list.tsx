"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import type { SurveyQuestion, SurveyResponse } from "../_lib/types";
import { assessmentLevelLabel } from "../_lib/survey-form-utils";
import { ExportLayoutDialog } from "./export-layout-dialog";

type SubmissionListProps = {
  clearingResponses: boolean;
  responses: SurveyResponse[];
  selectedResponseId: string;
  surveyId?: string;
  surveyQuestions: SurveyQuestion[];
  onClearResponses: () => void;
  onSelectResponse: (responseId: string) => void;
};

export function SubmissionList({
  clearingResponses,
  responses,
  selectedResponseId,
  surveyId,
  surveyQuestions,
  onClearResponses,
  onSelectResponse,
}: SubmissionListProps) {
  return (
    <div className="grid content-start gap-2">
      <SubmissionListToolbar
        clearingResponses={clearingResponses}
        responses={responses}
        surveyId={surveyId}
        surveyQuestions={surveyQuestions}
        onClearResponses={onClearResponses}
      />
      {responses.map((response) => (
        <SubmissionListItem
          key={response.id}
          response={response}
          selected={selectedResponseId === response.id}
          onSelect={() => onSelectResponse(response.id)}
        />
      ))}
    </div>
  );
}

function SubmissionListToolbar({
  clearingResponses,
  responses,
  surveyId,
  surveyQuestions,
  onClearResponses,
}: Omit<SubmissionListProps, "selectedResponseId" | "onSelectResponse">) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium text-muted-foreground">
        {responses.length} submissions
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <ExportLayoutDialog
          responses={responses}
          surveyId={surveyId}
          surveyQuestions={surveyQuestions}
        />
        <ClearSubmissionsDialog
          clearingResponses={clearingResponses}
          responsesCount={responses.length}
          onClearResponses={onClearResponses}
        />
      </div>
    </div>
  );
}

function SubmissionListItem({
  response,
  selected,
  onSelect,
}: {
  response: SurveyResponse;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-xl border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:bg-secondary/50",
        selected &&
          "border-primary bg-secondary shadow-[var(--shadow-cloud-selected)]",
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">
          {new Date(response.submittedAt).toLocaleString()}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary">
            {assessmentLevelLabel(response.assessmentLevel)}
          </Badge>
          <Badge variant="outline">
            {Number(response.correctnessPercentage).toFixed(1)}%
          </Badge>
        </div>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {response.id}
      </p>
    </button>
  );
}

function ClearSubmissionsDialog({
  clearingResponses,
  responsesCount,
  onClearResponses,
}: {
  clearingResponses: boolean;
  responsesCount: number;
  onClearResponses: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={clearingResponses}
        >
          {clearingResponses ? <Spinner /> : <Trash2 />}
          Clear all
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all submissions?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all {responsesCount} submissions and
            their answers. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={clearingResponses}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onClearResponses}
            disabled={clearingResponses}
          >
            {clearingResponses ? <Spinner /> : <Trash2 />}
            Clear all
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
