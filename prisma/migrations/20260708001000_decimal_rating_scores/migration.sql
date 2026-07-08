ALTER TABLE "survey_responses"
ALTER COLUMN "totalScore" TYPE DECIMAL(12, 2) USING "totalScore"::DECIMAL(12, 2);

ALTER TABLE "survey_responses"
ALTER COLUMN "maxScore" TYPE DECIMAL(12, 2) USING "maxScore"::DECIMAL(12, 2);

ALTER TABLE "survey_answers"
ALTER COLUMN "score" TYPE DECIMAL(12, 2) USING "score"::DECIMAL(12, 2);
