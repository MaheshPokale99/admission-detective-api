-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('enquiry', 'counselled', 'shortlisted', 'applied', 'admitted', 'lost');

-- CreateEnum
CREATE TYPE "Consent" AS ENUM ('opted_in', 'opted_out', 'unknown');

-- CreateEnum
CREATE TYPE "Eligibility" AS ENUM ('eligible', 'ineligible');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('form', 'call_note', 'whatsapp', 'email');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound', 'internal');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('pending_approval', 'approved', 'sent', 'rejected', 'failed');

-- CreateEnum
CREATE TYPE "OutcomeType" AS ENUM ('replied', 'session_booked', 'application_resumed', 'admitted', 'no_response');

-- CreateEnum
CREATE TYPE "RecoveryAction" AS ENUM ('send_fee_resource', 'offer_parent_session', 'share_scholarship_info', 'share_curriculum_info', 'answer_pending_question', 'schedule_callback', 'no_action');

-- CreateEnum
CREATE TYPE "ReasonCategory" AS ENUM ('fees', 'parent_approval', 'course_clarity', 'missing_information', 'competitor', 'callback_missed', 'timing', 'other');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "program" TEXT NOT NULL,
    "stage" "LeadStage" NOT NULL,
    "consent" "Consent" NOT NULL,
    "consent_note" TEXT NOT NULL DEFAULT '',
    "eligibility" "Eligibility" NOT NULL,
    "ineligible_reason" TEXT NOT NULL DEFAULT '',
    "counsellor" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "last_activity_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "verified_at" TIMESTAMPTZ(3) NOT NULL,
    "verified_by" TEXT NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "trace" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "investigation_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" "InterventionStatus" NOT NULL,
    "action" "RecoveryAction" NOT NULL,
    "primary_category" "ReasonCategory",
    "draft_subject" TEXT NOT NULL,
    "draft_body" TEXT NOT NULL,
    "final_subject" TEXT,
    "final_body" TEXT,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "resource_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(3),
    "rejection_reason" TEXT,
    "sent_at" TIMESTAMPTZ(3),
    "provider" TEXT,
    "provider_message_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outcomes" (
    "id" TEXT NOT NULL,
    "intervention_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "type" "OutcomeType" NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "lead_id" TEXT,
    "intervention_id" TEXT,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_last_activity_at_idx" ON "leads"("last_activity_at");

-- CreateIndex
CREATE INDEX "messages_lead_id_sent_at_idx" ON "messages"("lead_id", "sent_at");

-- CreateIndex
CREATE INDEX "investigations_lead_id_created_at_idx" ON "investigations"("lead_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "interventions_lead_id_created_at_idx" ON "interventions"("lead_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "interventions_status_idx" ON "interventions"("status");

-- CreateIndex
CREATE INDEX "outcomes_intervention_id_idx" ON "outcomes"("intervention_id");

-- CreateIndex
CREATE INDEX "outcomes_lead_id_created_at_idx" ON "outcomes"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_lead_id_id_idx" ON "audit_log"("lead_id", "id" DESC);

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_investigation_id_fkey" FOREIGN KEY ("investigation_id") REFERENCES "investigations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One pending recovery draft per lead (partial index, not expressible in Prisma schema)
CREATE UNIQUE INDEX "uq_interventions_one_pending_per_lead" ON "interventions" ("lead_id") WHERE "status" = 'pending_approval';
