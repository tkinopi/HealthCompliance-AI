import { pgTable, text, timestamp, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

// Enum types
export const userRoleEnum = ["ADMIN", "DOCTOR", "NURSE", "PHARMACIST", "STAFF", "COMPLIANCE_OFFICER"] as const
export type UserRole = typeof userRoleEnum[number]

export const genderEnum = ["MALE", "FEMALE", "OTHER"] as const
export type Gender = typeof genderEnum[number]

export const complianceCategoryEnum = [
  "MEDICAL_LAW",
  "PERSONAL_INFO",
  "LABOR_STANDARDS",
  "INFECTION_CONTROL",
  "FACILITY_SAFETY",
  "DRUG_MANAGEMENT",
  "MEDICAL_DEVICE",
  "PATIENT_RIGHTS",
  "QUALITY_MANAGEMENT",
  "EMERGENCY_RESPONSE",
  "STAFF_TRAINING",
  "DOCUMENTATION",
  "OTHER",
] as const
export type ComplianceCategory = typeof complianceCategoryEnum[number]

export const complianceStatusEnum = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "REVIEW", "APPROVED"] as const
export type ComplianceStatusType = typeof complianceStatusEnum[number]

export const priorityEnum = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const
export type Priority = typeof priorityEnum[number]

export const consentTypeEnum = [
  "PERSONAL_INFO_USAGE",      // 個人情報利用同意書
  "MEDICAL_INFO_PROVISION",   // 診療情報提供同意書
  "EXAMINATION_TREATMENT",    // 検査・治療同意書
  "SURGERY",                  // 手術同意書
  "ANESTHESIA",              // 麻酔同意書
  "HOSPITALIZATION",         // 入院同意書
  "CLINICAL_TRIAL",          // 臨床試験同意書
  "AUTOPSY",                 // 剖検同意書
  "OTHER",                   // その他
] as const
export type ConsentType = typeof consentTypeEnum[number]

export const consentStatusEnum = ["VALID", "EXPIRED", "EXPIRING_SOON"] as const
export type ConsentStatus = typeof consentStatusEnum[number]

// 医療機関タイプ
export const facilityTypeEnum = ["CLINIC", "CARE_FACILITY", "HOSPITAL", "DENTAL_CLINIC"] as const
export type FacilityType = typeof facilityTypeEnum[number]

// 規制タスクの頻度
export const taskFrequencyEnum = ["YEARLY", "SEMI_ANNUAL", "QUARTERLY", "BIMONTHLY", "MONTHLY", "CUSTOM"] as const
export type TaskFrequency = typeof taskFrequencyEnum[number]

// タスクインスタンスのステータス
export const taskStatusEnum = ["NOT_STARTED", "IN_PROGRESS", "UNDER_REVIEW", "COMPLETED"] as const
export type TaskStatus = typeof taskStatusEnum[number]

// 通知タイプ
export const notificationTypeEnum = ["URGENT", "WARNING", "INFO"] as const
export type NotificationType = typeof notificationTypeEnum[number]

// 通知カテゴリ
export const notificationCategoryEnum = [
  "CONSENT_EXPIRY",      // 患者同意書期限
  "TASK_DUE",           // 届出書類期限
  "LICENSE_EXPIRY",     // スタッフ資格証期限
  "SECURITY_ALERT",     // セキュリティアラート
] as const
export type NotificationCategory = typeof notificationCategoryEnum[number]

// 関連エンティティタイプ
export const relatedEntityTypeEnum = ["PATIENT", "TASK", "USER", "CONSENT", "ACCESS_LOG"] as const
export type RelatedEntityType = typeof relatedEntityTypeEnum[number]

// 医療機関（病院・クリニック）
export const organizations = pgTable(
  "Organization",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    type: text("type").notNull(), // 病院、クリニック、診療所など
    address: text("address"),
    phoneNumber: text("phoneNumber"),
    directorName: text("directorName"), // 管理者名
    establishedDate: timestamp("establishedDate", { mode: "date" }),
    licenseNumber: text("licenseNumber").unique(), // 医療機関番号
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    licenseNumberIdx: uniqueIndex("Organization_licenseNumber_idx").on(table.licenseNumber),
  })
)

// スタッフ（医療従事者）
export const users = pgTable(
  "User",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    password: text("password").notNull(),
    role: text("role").notNull().default("STAFF"), // UserRole
    department: text("department"),
    position: text("position"),
    licenseNumber: text("licenseNumber"),
    phoneNumber: text("phoneNumber"),
    twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
    twoFactorSecret: text("twoFactorSecret"),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("lastLoginAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => ({
    emailIdx: uniqueIndex("User_email_idx").on(table.email),
    organizationIdIdx: index("User_organizationId_idx").on(table.organizationId),
  })
)

// 患者基本情報
export const patients = pgTable(
  "Patient",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    patientNumber: text("patientNumber").notNull().unique(), // 患者番号
    lastName: text("lastName").notNull(),
    firstName: text("firstName").notNull(),
    lastNameKana: text("lastNameKana"),
    firstNameKana: text("firstNameKana"),
    gender: text("gender"), // Gender enum
    dateOfBirth: timestamp("dateOfBirth", { mode: "date" }),
    phoneNumber: text("phoneNumber"),
    email: text("email"),
    address: text("address"),
    emergencyContact: text("emergencyContact"), // 緊急連絡先
    bloodType: text("bloodType"),
    allergies: text("allergies"), // アレルギー情報
    medicalHistory: text("medicalHistory"), // 既往歴
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => ({
    patientNumberIdx: uniqueIndex("Patient_patientNumber_idx").on(table.patientNumber),
    organizationIdIdx: index("Patient_organizationId_idx").on(table.organizationId),
  })
)

// 患者記録（カルテ関連）
export const patientRecords = pgTable(
  "PatientRecord",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    recordType: text("recordType").notNull(), // 診療記録、検査結果、処方箋など
    content: text("content").notNull(),
    recordDate: timestamp("recordDate", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    patientId: text("patientId")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    createdById: text("createdById")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    patientIdIdx: index("PatientRecord_patientId_idx").on(table.patientId),
    createdByIdIdx: index("PatientRecord_createdById_idx").on(table.createdById),
    recordDateIdx: index("PatientRecord_recordDate_idx").on(table.recordDate),
  })
)

// コンプライアンス状況
export const complianceStatuses = pgTable(
  "ComplianceStatus",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    category: text("category").notNull(), // ComplianceCategory enum
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("PENDING"), // ComplianceStatusType enum
    priority: text("priority").notNull().default("MEDIUM"), // Priority enum
    dueDate: timestamp("dueDate", { mode: "date" }),
    completedDate: timestamp("completedDate", { mode: "date" }),
    assignedToId: text("assignedToId").references(() => users.id, { onDelete: "set null" }),
    reviewNotes: text("reviewNotes"),
    evidenceUrl: text("evidenceUrl"), // 証跡ファイルのURL
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => ({
    organizationIdIdx: index("ComplianceStatus_organizationId_idx").on(table.organizationId),
    statusIdx: index("ComplianceStatus_status_idx").on(table.status),
    categoryIdx: index("ComplianceStatus_category_idx").on(table.category),
    dueDateIdx: index("ComplianceStatus_dueDate_idx").on(table.dueDate),
  })
)

// 患者同意書
export const consents = pgTable(
  "Consent",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    consentType: text("consentType").notNull(), // ConsentType enum
    obtainedDate: timestamp("obtainedDate", { mode: "date" }).notNull(), // 取得日
    expiryDate: timestamp("expiryDate", { mode: "date" }), // 有効期限
    status: text("status").notNull().default("VALID"), // ConsentStatus enum
    notes: text("notes"), // 備考
    documentUrl: text("documentUrl"), // 同意書ファイルのURL
    witnessName: text("witnessName"), // 立会人名
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    patientId: text("patientId")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    obtainedById: text("obtainedById")
      .notNull()
      .references(() => users.id), // 取得者（スタッフ）
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => ({
    patientIdIdx: index("Consent_patientId_idx").on(table.patientId),
    consentTypeIdx: index("Consent_consentType_idx").on(table.consentType),
    statusIdx: index("Consent_status_idx").on(table.status),
    expiryDateIdx: index("Consent_expiryDate_idx").on(table.expiryDate),
    organizationIdIdx: index("Consent_organizationId_idx").on(table.organizationId),
  })
)

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  patients: many(patients),
  complianceStatuses: many(complianceStatuses),
  consents: many(consents),
  regulatoryTasks: many(regulatoryTasks),
  taskInstances: many(taskInstances),
  documentTemplates: many(documentTemplates),
  submissionHistories: many(submissionHistories),
  notifications: many(notifications),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  complianceStatuses: many(complianceStatuses),
  patientRecords: many(patientRecords),
  consentsObtained: many(consents),
  taskInstancesAssigned: many(taskInstances),
  submissionHistories: many(submissionHistories),
  accounts: many(accounts),
  sessions: many(sessions),
  loginHistory: many(loginHistory),
  notifications: many(notifications),
}))

export const patientsRelations = relations(patients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [patients.organizationId],
    references: [organizations.id],
  }),
  records: many(patientRecords),
  consents: many(consents),
}))

export const patientRecordsRelations = relations(patientRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [patientRecords.patientId],
    references: [patients.id],
  }),
  createdBy: one(users, {
    fields: [patientRecords.createdById],
    references: [users.id],
  }),
}))

export const complianceStatusesRelations = relations(complianceStatuses, ({ one }) => ({
  organization: one(organizations, {
    fields: [complianceStatuses.organizationId],
    references: [organizations.id],
  }),
  assignedTo: one(users, {
    fields: [complianceStatuses.assignedToId],
    references: [users.id],
  }),
}))

export const consentsRelations = relations(consents, ({ one }) => ({
  patient: one(patients, {
    fields: [consents.patientId],
    references: [patients.id],
  }),
  obtainedBy: one(users, {
    fields: [consents.obtainedById],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [consents.organizationId],
    references: [organizations.id],
  }),
}))

// NextAuth関連テーブル
export const accounts = pgTable(
  "Account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: timestamp("expires_at", { mode: "date" }),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    userIdIdx: index("Account_userId_idx").on(table.userId),
  })
)

export const sessions = pgTable(
  "Session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    sessionToken: text("sessionToken").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    sessionTokenIdx: uniqueIndex("Session_sessionToken_idx").on(table.sessionToken),
    userIdIdx: index("Session_userId_idx").on(table.userId),
  })
)

export const verificationTokens = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("VerificationToken_token_idx").on(table.token),
  })
)

// ログイン履歴（医療情報システムのため必須）
export const loginHistory = pgTable(
  "LoginHistory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    success: boolean("success").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    failureReason: text("failureReason"), // ログイン失敗の理由
    twoFactorUsed: boolean("twoFactorUsed").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("LoginHistory_userId_idx").on(table.userId),
    createdAtIdx: index("LoginHistory_createdAt_idx").on(table.createdAt),
  })
)

// ログイン試行回数制限
export const loginAttempts = pgTable(
  "LoginAttempt",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    ipAddress: text("ipAddress").notNull(),
    attemptCount: integer("attemptCount").notNull().default(0),
    lastAttemptAt: timestamp("lastAttemptAt", { mode: "date" }).notNull().defaultNow(),
    lockedUntil: timestamp("lockedUntil", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIpIdx: index("LoginAttempt_email_ip_idx").on(table.email, table.ipAddress),
  })
)

// Relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
}))

// Type exports
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Patient = typeof patients.$inferSelect
export type NewPatient = typeof patients.$inferInsert
export type PatientRecord = typeof patientRecords.$inferSelect
export type NewPatientRecord = typeof patientRecords.$inferInsert
export type ComplianceStatus = typeof complianceStatuses.$inferSelect
export type NewComplianceStatus = typeof complianceStatuses.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert
export type LoginHistory = typeof loginHistory.$inferSelect
export type NewLoginHistory = typeof loginHistory.$inferInsert
export type LoginAttempt = typeof loginAttempts.$inferSelect
export type NewLoginAttempt = typeof loginAttempts.$inferInsert
export type Consent = typeof consents.$inferSelect
export type NewConsent = typeof consents.$inferInsert

// 規制タスクマスター（医療法規制に基づく届出・報告のテンプレート）
export const regulatoryTasks = pgTable(
  "RegulatoryTask",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(), // 届出名（例：診療所開設届）
    description: text("description"), // 詳細説明
    facilityType: text("facilityType").notNull(), // FacilityType enum
    frequency: text("frequency").notNull(), // TaskFrequency enum
    dueMonths: text("dueMonths"), // JSON配列: 期限となる月 例: [3, 9] = 3月と9月
    dueDays: integer("dueDays"), // 期限日（月の何日目か）
    dueCalculation: text("dueCalculation"), // 期限計算ロジック（例：決算後3ヶ月）
    reminderDays: integer("reminderDays").notNull().default(7), // リマインダーを出す日数前
    documentTemplateId: text("documentTemplateId").references(() => documentTemplates.id),
    requiredFields: text("requiredFields"), // JSON: 必要な記入項目の定義
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => ({
    organizationIdIdx: index("RegulatoryTask_organizationId_idx").on(table.organizationId),
    facilityTypeIdx: index("RegulatoryTask_facilityType_idx").on(table.facilityType),
  })
)

// タスクインスタンス（実際の各回の届出）
export const taskInstances = pgTable(
  "TaskInstance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    regulatoryTaskId: text("regulatoryTaskId")
      .notNull()
      .references(() => regulatoryTasks.id, { onDelete: "cascade" }),
    dueDate: timestamp("dueDate", { mode: "date" }).notNull(), // 期限日
    status: text("status").notNull().default("NOT_STARTED"), // TaskStatus enum
    assignedToId: text("assignedToId").references(() => users.id, { onDelete: "set null" }),
    startedAt: timestamp("startedAt", { mode: "date" }),
    completedAt: timestamp("completedAt", { mode: "date" }),
    documentContent: text("documentContent"), // JSON: 作成中の書類内容
    submittedDocumentUrl: text("submittedDocumentUrl"), // 提出済み書類のURL
    notes: text("notes"), // 備考
    aiGenerated: boolean("aiGenerated").notNull().default(false), // AI生成フラグ
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => ({
    regulatoryTaskIdIdx: index("TaskInstance_regulatoryTaskId_idx").on(table.regulatoryTaskId),
    dueDateIdx: index("TaskInstance_dueDate_idx").on(table.dueDate),
    statusIdx: index("TaskInstance_status_idx").on(table.status),
    assignedToIdIdx: index("TaskInstance_assignedToId_idx").on(table.assignedToId),
    organizationIdIdx: index("TaskInstance_organizationId_idx").on(table.organizationId),
  })
)

// 書類テンプレート
export const documentTemplates = pgTable(
  "DocumentTemplate",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(), // テンプレート名
    templateType: text("templateType").notNull(), // テンプレートタイプ
    content: text("content"), // JSON: フォーム定義
    pdfTemplate: text("pdfTemplate"), // PDFテンプレートのパス
    fields: text("fields"), // JSON: フィールド定義
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => ({
    organizationIdIdx: index("DocumentTemplate_organizationId_idx").on(table.organizationId),
  })
)

// 提出履歴
export const submissionHistories = pgTable(
  "SubmissionHistory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    taskInstanceId: text("taskInstanceId")
      .notNull()
      .references(() => taskInstances.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submittedAt", { mode: "date" }).notNull(), // 提出日時
    submittedById: text("submittedById")
      .notNull()
      .references(() => users.id), // 提出者
    documentUrl: text("documentUrl"), // 提出書類のURL
    documentContent: text("documentContent"), // JSON: 提出時の書類内容
    notes: text("notes"), // 備考
    receiptNumber: text("receiptNumber"), // 受理番号
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => ({
    taskInstanceIdIdx: index("SubmissionHistory_taskInstanceId_idx").on(table.taskInstanceId),
    submittedAtIdx: index("SubmissionHistory_submittedAt_idx").on(table.submittedAt),
    organizationIdIdx: index("SubmissionHistory_organizationId_idx").on(table.organizationId),
  })
)

// Relations for new tables
export const regulatoryTasksRelations = relations(regulatoryTasks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [regulatoryTasks.organizationId],
    references: [organizations.id],
  }),
  documentTemplate: one(documentTemplates, {
    fields: [regulatoryTasks.documentTemplateId],
    references: [documentTemplates.id],
  }),
  taskInstances: many(taskInstances),
}))

export const taskInstancesRelations = relations(taskInstances, ({ one, many }) => ({
  regulatoryTask: one(regulatoryTasks, {
    fields: [taskInstances.regulatoryTaskId],
    references: [regulatoryTasks.id],
  }),
  assignedTo: one(users, {
    fields: [taskInstances.assignedToId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [taskInstances.organizationId],
    references: [organizations.id],
  }),
  submissionHistories: many(submissionHistories),
}))

export const documentTemplatesRelations = relations(documentTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documentTemplates.organizationId],
    references: [organizations.id],
  }),
  regulatoryTasks: many(regulatoryTasks),
}))

export const submissionHistoriesRelations = relations(submissionHistories, ({ one }) => ({
  taskInstance: one(taskInstances, {
    fields: [submissionHistories.taskInstanceId],
    references: [taskInstances.id],
  }),
  submittedBy: one(users, {
    fields: [submissionHistories.submittedById],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [submissionHistories.organizationId],
    references: [organizations.id],
  }),
}))

// Type exports for new tables
export type RegulatoryTask = typeof regulatoryTasks.$inferSelect
export type NewRegulatoryTask = typeof regulatoryTasks.$inferInsert
export type TaskInstance = typeof taskInstances.$inferSelect
export type NewTaskInstance = typeof taskInstances.$inferInsert
export type DocumentTemplate = typeof documentTemplates.$inferSelect
export type NewDocumentTemplate = typeof documentTemplates.$inferInsert
export type SubmissionHistory = typeof submissionHistories.$inferSelect
export type NewSubmissionHistory = typeof submissionHistories.$inferInsert

// 通知テーブル（リアルタイムアラート）
export const notifications = pgTable(
  "Notification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    type: text("type").notNull(), // NotificationType enum: URGENT, WARNING, INFO
    category: text("category").notNull(), // NotificationCategory enum
    title: text("title").notNull(), // 通知タイトル
    message: text("message").notNull(), // 通知メッセージ
    priority: text("priority").notNull().default("MEDIUM"), // Priority enum
    isRead: boolean("isRead").notNull().default(false), // 既読フラグ
    isHandled: boolean("isHandled").notNull().default(false), // 対応済みフラグ
    relatedId: text("relatedId"), // 関連エンティティのID
    relatedType: text("relatedType"), // RelatedEntityType enum
    actionUrl: text("actionUrl"), // アクション先のURL
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // 通知の受信者
    organizationId: text("organizationId")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    readAt: timestamp("readAt", { mode: "date" }), // 既読日時
    handledAt: timestamp("handledAt", { mode: "date" }), // 対応日時
  },
  (table) => ({
    userIdIdx: index("Notification_userId_idx").on(table.userId),
    organizationIdIdx: index("Notification_organizationId_idx").on(table.organizationId),
    typeIdx: index("Notification_type_idx").on(table.type),
    categoryIdx: index("Notification_category_idx").on(table.category),
    isReadIdx: index("Notification_isRead_idx").on(table.isRead),
    createdAtIdx: index("Notification_createdAt_idx").on(table.createdAt),
  })
)

// Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
}))

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
