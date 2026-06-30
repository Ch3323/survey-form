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
import {
  formatAnswer,
  typeLabel,
} from "../_lib/survey-form-utils";
import type { SurveyResponse } from "../_lib/types";
import { Stat } from "./stat";

type SubmissionViewProps = {
  deletingResponseId: string;
  responses: SurveyResponse[];
  selectedResponse?: SurveyResponse;
  selectedResponseId: string;
  onDeleteResponse: (responseId: string) => void;
  onSelectResponse: (responseId: string) => void;
};

export function SubmissionView({
  deletingResponseId,
  responses,
  selectedResponse,
  selectedResponseId,
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
