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
import {
  formatAnswer,
  typeLabel,
} from "../_lib/survey-form-utils";
import type { SurveyResponse } from "../_lib/types";
import { Stat } from "./stat";

type SubmissionViewProps = {
  clearingResponses: boolean;
  deletingResponseId: string;
  responses: SurveyResponse[];
  selectedResponse?: SurveyResponse;
  selectedResponseId: string;
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
      <div className="grid content-start gap-2">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {responses.length} submissions
          </p>
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
                  This will permanently delete all {responses.length} submissions
                  and their answers. This action cannot be undone.
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
        </div>
        {responses.map((response) => (
          <button
            key={response.id}
            type="button"
            className={cn(
              "rounded-xl border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:bg-secondary/50",
              selectedResponseId === response.id &&
                "border-primary bg-secondary shadow-[var(--shadow-cloud-selected)]",
            )}
            onClick={() => onSelectResponse(response.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">
                {new Date(response.submittedAt).toLocaleString()}
              </span>
              <Badge variant="outline">
                {Number(response.averageScore).toFixed(1)}
              </Badge>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {response.id}
            </p>
          </button>
        ))}
      </div>

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
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Total score"
                  value={Number(selectedResponse.totalScore).toFixed(0)}
                />
                <Stat
                  label="Average"
                  value={Number(selectedResponse.averageScore).toFixed(1)}
                />
              </div>
              <div className="grid gap-3">
                {selectedResponse.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="rounded-xl border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{answer.questionTitleSnapshot}</p>
                      <Badge variant="secondary">
                        {typeLabel(answer.questionInputType)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatAnswer(answer)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDeleteResponse(selectedResponse.id)}
                  disabled={deletingResponseId === selectedResponse.id}
                >
                  {deletingResponseId === selectedResponse.id ? (
                    <Spinner />
                  ) : (
                    <Trash2 />
                  )}
                  Delete submission
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
