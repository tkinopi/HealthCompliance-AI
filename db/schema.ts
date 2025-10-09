import { pgTable, text, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core"
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

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  patients: many(patients),
  complianceStatuses: many(complianceStatuses),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  complianceStatuses: many(complianceStatuses),
  patientRecords: many(patientRecords),
}))

export const patientsRelations = relations(patients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [patients.organizationId],
    references: [organizations.id],
  }),
  records: many(patientRecords),
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
