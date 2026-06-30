-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "SurveyQuestionInputType" AS ENUM ('RATING', 'TEXT', 'TEXTAREA', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'BOOLEAN', 'NUMBER', 'DATE', 'EMAIL', 'URL');

-- CreateTable
CREATE TABLE "surveys" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" UUID NOT NULL,
    "surveyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "helpText" TEXT,
    "inputType" "SurveyQuestionInputType" NOT NULL DEFAULT 'TEXT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "placeholder" VARCHAR(255),
    "defaultValue" TEXT,
    "maxLength" INTEGER,
    "minValue" DECIMAL(12,2),
    "maxValue" DECIMAL(12,2),
    "stepValue" DECIMAL(12,2),
    "settings" JSONB,
    "validation" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_question_options" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" VARCHAR(160) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" UUID NOT NULL,
    "surveyId" UUID NOT NULL,
    "anonymousKey" VARCHAR(120),
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" UUID NOT NULL,
    "responseId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "questionTitleSnapshot" TEXT NOT NULL,
    "questionInputType" "SurveyQuestionInputType" NOT NULL,
    "score" INTEGER,
    "textValue" TEXT,
    "booleanValue" BOOLEAN,
    "numberValue" DECIMAL(12,2),
    "dateValue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answer_options" (
    "id" UUID NOT NULL,
    "answerId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_answer_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_accounts" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" VARCHAR(120),
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surveys_slug_key" ON "surveys"("slug");

-- CreateIndex
CREATE INDEX "surveys_status_idx" ON "surveys"("status");

-- CreateIndex
CREATE INDEX "survey_questions_surveyId_sortOrder_idx" ON "survey_questions"("surveyId", "sortOrder");

-- CreateIndex
CREATE INDEX "survey_questions_surveyId_inputType_idx" ON "survey_questions"("surveyId", "inputType");

-- CreateIndex
CREATE INDEX "survey_questions_surveyId_isActive_idx" ON "survey_questions"("surveyId", "isActive");

-- CreateIndex
CREATE INDEX "survey_question_options_questionId_sortOrder_idx" ON "survey_question_options"("questionId", "sortOrder");

-- CreateIndex
CREATE INDEX "survey_question_options_questionId_isActive_idx" ON "survey_question_options"("questionId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "survey_question_options_questionId_value_key" ON "survey_question_options"("questionId", "value");

-- CreateIndex
CREATE INDEX "survey_responses_surveyId_submittedAt_idx" ON "survey_responses"("surveyId", "submittedAt");

-- CreateIndex
CREATE INDEX "survey_responses_anonymousKey_idx" ON "survey_responses"("anonymousKey");

-- CreateIndex
CREATE INDEX "survey_answers_questionId_idx" ON "survey_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answers_responseId_questionId_key" ON "survey_answers"("responseId", "questionId");

-- CreateIndex
CREATE INDEX "survey_answer_options_optionId_idx" ON "survey_answer_options"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answer_options_answerId_optionId_key" ON "survey_answer_options"("answerId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_accounts_email_key" ON "admin_accounts"("email");

-- CreateIndex
CREATE INDEX "admin_accounts_role_idx" ON "admin_accounts"("role");

-- CreateIndex
CREATE INDEX "admin_accounts_isActive_idx" ON "admin_accounts"("isActive");

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_question_options" ADD CONSTRAINT "survey_question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answer_options" ADD CONSTRAINT "survey_answer_options_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "survey_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answer_options" ADD CONSTRAINT "survey_answer_options_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "survey_question_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
