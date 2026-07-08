import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SurveyResponse } from "../_lib/types";
import {
    assessmentLevelLabel,
    formatScore,
} from "../_lib/survey-form-utils";
import { Stat } from "./stat";

export function SubmissionOverview({ responses }: { responses: SurveyResponse[] }) {
    const totalResponses = responses.length;
    const advancedResponses = responses.filter(
        (response) => response.assessmentLevel === "ADVANCED",
    ).length;
    const beginnerResponses = totalResponses - advancedResponses;
    const totalScores = responses.map((response) => toFiniteNumber(response.totalScore));
    const maxScores = responses.map((response) => toFiniteNumber(response.maxScore));
    const totalScore = totalScores.reduce((sum, score) => sum + score, 0);
    const averageScore = totalResponses > 0 ? totalScore / totalResponses : 0;
    const topScore = totalScores.length > 0 ? Math.max(...totalScores) : 0;
    const minScore = totalScores.length > 0 ? Math.min(...totalScores) : 0;
    const maxScore = maxScores.length > 0 ? Math.max(...maxScores) : 0;
    const advancedPercentage = percentage(advancedResponses, totalResponses);
    const beginnerPercentage = percentage(beginnerResponses, totalResponses);

    return (
        <Card className="rounded-xl">
            <CardHeader className="flex justify-between gap-3 border-b bg-card">
                <div>
                    <CardTitle className="text-xl font-semibold text-cloud-heading">
                        Submission overview
                    </CardTitle>
                    <CardDescription>
                        Clean snapshot of level distribution and score performance.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <Stat label="Responses" value={totalResponses} />
                    <Stat
                        label={assessmentLevelLabel("BEGINNER")}
                        value={beginnerResponses}
                    />
                    <Stat
                        label={assessmentLevelLabel("ADVANCED")}
                        value={advancedResponses}
                    />
                </div>

                <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
                    <section className="rounded-xl border border-border bg-secondary/40 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-cloud-heading">
                                    Assessment split
                                </p>
                                <p className="text-xs text-cloud-muted">
                                    Beginner vs advance submissions
                                </p>
                            </div>
                            <p className="text-sm font-medium text-cloud-heading">
                                {totalResponses} total
                            </p>
                        </div>
                        <div className="grid gap-3">
                            <LevelBar
                                label={assessmentLevelLabel("BEGINNER")}
                                count={beginnerResponses}
                                percentage={beginnerPercentage}
                            />
                            <LevelBar
                                label={assessmentLevelLabel("ADVANCED")}
                                count={advancedResponses}
                                percentage={advancedPercentage}
                                highlight
                            />
                        </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <ScoreTile label="Top score" value={topScore} maxScore={maxScore} />
                        <ScoreTile label="Min score" value={minScore} maxScore={maxScore} />
                        <ScoreTile label="Max score" value={maxScore} />
                        <ScoreTile label="Avg. score" value={averageScore} />
                    </section>
                </div>
            </CardContent>
        </Card>
    );
}

function LevelBar({
    label,
    count,
    percentage,
    highlight = false,
}: {
    label: string;
    count: number;
    percentage: number;
    highlight?: boolean;
}) {
    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-cloud-heading">{label}</span>
                <span className="text-cloud-muted">
                    {count} ({formatPercentage(percentage)})
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-card">
                <div
                    className={cn(
                        "h-full rounded-full bg-cloud-primary/60",
                        highlight && "bg-cloud-primary",
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function ScoreTile({
    label,
    value,
    maxScore,
}: {
    label: string;
    value: number;
    maxScore?: number;
}) {
    const scoreLabel =
        maxScore !== undefined && maxScore > 0
            ? `${formatScore(value)} / ${formatScore(maxScore)}`
            : formatScore(value);

    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
            <p className="text-xs font-medium text-cloud-muted">{label}</p>
            <p className="mt-1 text-lg font-semibold text-cloud-heading">
                {scoreLabel}
            </p>
        </div>
    );
}

function toFiniteNumber(value: number | string) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
}

function percentage(value: number, total: number) {
    return total > 0 ? (value / total) * 100 : 0;
}

function formatPercentage(value: number) {
    return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}
