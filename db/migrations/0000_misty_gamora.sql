CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" timestamp,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "ComplianceStatus" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"dueDate" timestamp,
	"completedDate" timestamp,
	"assignedToId" text,
	"reviewNotes" text,
	"evidenceUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"organizationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LoginAttempt" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"ipAddress" text NOT NULL,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"lastAttemptAt" timestamp DEFAULT now() NOT NULL,
	"lockedUntil" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LoginHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"email" text NOT NULL,
	"success" boolean NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"failureReason" text,
	"twoFactorUsed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"address" text,
	"phoneNumber" text,
	"directorName" text,
	"establishedDate" timestamp,
	"licenseNumber" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Organization_licenseNumber_unique" UNIQUE("licenseNumber")
);
--> statement-breakpoint
CREATE TABLE "PatientRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"recordType" text NOT NULL,
	"content" text NOT NULL,
	"recordDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"patientId" text NOT NULL,
	"createdById" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Patient" (
	"id" text PRIMARY KEY NOT NULL,
	"patientNumber" text NOT NULL,
	"lastName" text NOT NULL,
	"firstName" text NOT NULL,
	"lastNameKana" text,
	"firstNameKana" text,
	"gender" text,
	"dateOfBirth" timestamp,
	"phoneNumber" text,
	"email" text,
	"address" text,
	"emergencyContact" text,
	"bloodType" text,
	"allergies" text,
	"medicalHistory" text,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"organizationId" text NOT NULL,
	CONSTRAINT "Patient_patientNumber_unique" UNIQUE("patientNumber")
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionToken" text NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Session_sessionToken_unique" UNIQUE("sessionToken")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'STAFF' NOT NULL,
	"department" text,
	"position" text,
	"licenseNumber" text,
	"phoneNumber" text,
	"twoFactorEnabled" boolean DEFAULT false NOT NULL,
	"twoFactorSecret" text,
	"emailVerified" timestamp,
	"image" text,
	"active" boolean DEFAULT true NOT NULL,
	"lastLoginAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"organizationId" text NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "VerificationToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ComplianceStatus" ADD CONSTRAINT "ComplianceStatus_assignedToId_User_id_fk" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ComplianceStatus" ADD CONSTRAINT "ComplianceStatus_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PatientRecord" ADD CONSTRAINT "PatientRecord_patientId_Patient_id_fk" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PatientRecord" ADD CONSTRAINT "PatientRecord_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Account_userId_idx" ON "Account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ComplianceStatus_organizationId_idx" ON "ComplianceStatus" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "ComplianceStatus_status_idx" ON "ComplianceStatus" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ComplianceStatus_category_idx" ON "ComplianceStatus" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ComplianceStatus_dueDate_idx" ON "ComplianceStatus" USING btree ("dueDate");--> statement-breakpoint
CREATE INDEX "LoginAttempt_email_ip_idx" ON "LoginAttempt" USING btree ("email","ipAddress");--> statement-breakpoint
CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "LoginHistory_createdAt_idx" ON "LoginHistory" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "Organization_licenseNumber_idx" ON "Organization" USING btree ("licenseNumber");--> statement-breakpoint
CREATE INDEX "PatientRecord_patientId_idx" ON "PatientRecord" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "PatientRecord_createdById_idx" ON "PatientRecord" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "PatientRecord_recordDate_idx" ON "PatientRecord" USING btree ("recordDate");--> statement-breakpoint
CREATE UNIQUE INDEX "Patient_patientNumber_idx" ON "Patient" USING btree ("patientNumber");--> statement-breakpoint
CREATE INDEX "Patient_organizationId_idx" ON "Patient" USING btree ("organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "Session_sessionToken_idx" ON "Session" USING btree ("sessionToken");--> statement-breakpoint
CREATE INDEX "Session_userId_idx" ON "Session" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_idx" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "User_organizationId_idx" ON "User" USING btree ("organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "VerificationToken_token_idx" ON "VerificationToken" USING btree ("token");