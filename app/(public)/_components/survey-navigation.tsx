"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";

type SurveyNavigationProps = {
  canSubmit: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function SurveyNavigation({
  canSubmit,
  isFirstPage,
  isLastPage,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: SurveyNavigationProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-cloud-panel)]">
      <Button
        type="button"
        variant="outline"
        disabled={isFirstPage}
        onClick={onBack}
      >
        <ArrowLeft />
        Back
      </Button>
      {isLastPage ? (
        <Button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={onSubmit}
        >
          {submitting ? <Spinner /> : <Send />}
          Submit
        </Button>
      ) : (
        <Button type="button" onClick={onNext}>
          Next
          <ArrowRight />
        </Button>
      )}
    </div>
  );
}
