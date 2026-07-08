CREATE TYPE "AssessmentLevel" AS ENUM ('BEGINNER', 'ADVANCED');

ALTER TABLE "surveys"
ADD COLUMN "correctnessThreshold" INTEGER NOT NULL DEFAULT 70;

ALTER TABLE "survey_responses"
ADD COLUMN "maxScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "correctnessPercentage" DECIMAL(5, 2) NOT NULL DEFAULT 0,
ADD COLUMN "assessmentLevel" "AssessmentLevel" NOT NULL DEFAULT 'BEGINNER';
