ALTER TABLE "survey_question_options"
ADD COLUMN "score" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "survey_responses"
ALTER COLUMN "averageScore" TYPE DECIMAL(12, 2);
