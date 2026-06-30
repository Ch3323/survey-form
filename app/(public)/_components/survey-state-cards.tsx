"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { PageShell } from "./page-shell";

export function SurveyLoading() {
  return (
    <PageShell>
      <Card className="rounded-xl">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="size-6 text-primary" />
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function SurveyUnavailable({
  message,
  onReload,
}: {
  message: string;
  onReload: () => void;
}) {
  return (
    <PageShell>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Survey is not available</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={onReload}>
            <RotateCcw />
            Reload
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function SurveySubmitted({
  averageScore,
  responseId,
  onReset,
}: {
  averageScore: number | null;
  responseId: string;
  onReset: () => void;
}) {
  return (
    <PageShell>
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-cloud-success-soft text-cloud-success">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <CardTitle>Submission received</CardTitle>
              <CardDescription>
                {responseId ? `Response ID: ${responseId}` : "Thank you."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {averageScore !== null ? (
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Average score</p>
              <p className="mt-1 text-3xl font-semibold">
                {averageScore.toFixed(1)}
              </p>
            </div>
          ) : null}
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcw />
            Start again
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
