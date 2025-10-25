import { db } from "./db"
import {
  notifications,
  consents,
  taskInstances,
  users,
  patients,
  type NewNotification,
  type NotificationType,
  type NotificationCategory,
} from "@/db/schema"
import { eq, and, lte, gte, isNull, or } from "drizzle-orm"

/**
 * 期限監視と通知生成のユーティリティ
 */

interface NotificationParams {
  userId: string
  organizationId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  relatedId?: string
  relatedType?: "PATIENT" | "TASK" | "USER" | "CONSENT" | "ACCESS_LOG"
  actionUrl?: string
}

/**
 * 通知を作成
 */
export async function createNotification(params: NotificationParams) {
  const newNotification: NewNotification = {
    ...params,
  }

  const [notification] = await db
    .insert(notifications)
    .values(newNotification)
    .returning()

  return notification
}

/**
 * 患者同意書の期限をチェックして通知を生成
 */
export async function checkConsentExpiry(organizationId: string) {
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // 期限が7日以内の同意書を取得
  const expiringConsents = await db
    .select({
      consent: consents,
      patient: patients,
      obtainedBy: users,
    })
    .from(consents)
    .leftJoin(patients, eq(consents.patientId, patients.id))
    .leftJoin(users, eq(consents.obtainedById, users.id))
    .where(
      and(
        eq(consents.organizationId, organizationId),
        lte(consents.expiryDate, sevenDaysLater),
        gte(consents.expiryDate, now),
        eq(consents.status, "VALID")
      )
    )

  const createdNotifications = []

  for (const { consent, patient, obtainedBy } of expiringConsents) {
    if (!consent.expiryDate || !patient || !obtainedBy) continue

    const daysUntilExpiry = Math.ceil(
      (consent.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    let type: NotificationType = "INFO"
    let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM"

    if (daysUntilExpiry === 0) {
      type = "URGENT"
      priority = "URGENT"
    } else if (daysUntilExpiry <= 3) {
      type = "WARNING"
      priority = "HIGH"
    } else if (daysUntilExpiry <= 7) {
      type = "WARNING"
      priority = "MEDIUM"
    }

    // 担当者に通知
    const notification = await createNotification({
      userId: obtainedBy.id,
      organizationId,
      type,
      category: "CONSENT_EXPIRY",
      title: `患者同意書の期限が間近です`,
      message: `患者「${patient.lastName} ${patient.firstName}」様の${consent.consentType}が${daysUntilExpiry}日後に期限切れとなります。`,
      priority,
      relatedId: consent.id,
      relatedType: "CONSENT",
      actionUrl: `/dashboard/consents`,
    })

    createdNotifications.push(notification)

    // 管理者にも通知（期限当日または3日前）
    if (daysUntilExpiry <= 3) {
      const admins = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.organizationId, organizationId),
            eq(users.role, "ADMIN"),
            eq(users.active, true)
          )
        )

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          organizationId,
          type,
          category: "CONSENT_EXPIRY",
          title: `【管理者通知】患者同意書の期限が間近です`,
          message: `患者「${patient.lastName} ${patient.firstName}」様の${consent.consentType}が${daysUntilExpiry}日後に期限切れとなります。担当: ${obtainedBy.name}`,
          priority,
          relatedId: consent.id,
          relatedType: "CONSENT",
          actionUrl: `/dashboard/consents`,
        })
      }
    }
  }

  return createdNotifications
}

/**
 * 届出書類の提出期限をチェックして通知を生成
 */
export async function checkTaskDueDate(organizationId: string) {
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // 期限が30日以内で未完了のタスクを取得
  const dueTasks = await db
    .select({
      task: taskInstances,
      assignedTo: users,
    })
    .from(taskInstances)
    .leftJoin(users, eq(taskInstances.assignedToId, users.id))
    .where(
      and(
        eq(taskInstances.organizationId, organizationId),
        lte(taskInstances.dueDate, thirtyDaysLater),
        gte(taskInstances.dueDate, now),
        or(
          eq(taskInstances.status, "NOT_STARTED"),
          eq(taskInstances.status, "IN_PROGRESS")
        )
      )
    )

  const createdNotifications = []

  for (const { task, assignedTo } of dueTasks) {
    const daysUntilDue = Math.ceil(
      (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    let type: NotificationType = "INFO"
    let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM"

    if (daysUntilDue === 0) {
      type = "URGENT"
      priority = "URGENT"
    } else if (daysUntilDue <= 3) {
      type = "URGENT"
      priority = "URGENT"
    } else if (daysUntilDue <= 7) {
      type = "WARNING"
      priority = "HIGH"
    } else if (daysUntilDue <= 30) {
      type = "INFO"
      priority = "MEDIUM"
    }

    // 担当者に通知
    if (assignedTo) {
      const notification = await createNotification({
        userId: assignedTo.id,
        organizationId,
        type,
        category: "TASK_DUE",
        title: `届出書類の提出期限が間近です`,
        message: `タスク「${task.regulatoryTaskId}」の提出期限が${daysUntilDue}日後です。`,
        priority,
        relatedId: task.id,
        relatedType: "TASK",
        actionUrl: `/dashboard/tasks/${task.id}`,
      })

      createdNotifications.push(notification)
    }

    // 管理者にも通知（期限7日前以降）
    if (daysUntilDue <= 7) {
      const admins = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.organizationId, organizationId),
            eq(users.role, "ADMIN"),
            eq(users.active, true)
          )
        )

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          organizationId,
          type,
          category: "TASK_DUE",
          title: `【管理者通知】届出書類の提出期限が間近です`,
          message: `タスク「${task.regulatoryTaskId}」の提出期限が${daysUntilDue}日後です。${assignedTo ? `担当: ${assignedTo.name}` : "担当者未設定"}`,
          priority,
          relatedId: task.id,
          relatedType: "TASK",
          actionUrl: `/dashboard/tasks/${task.id}`,
        })
      }
    }
  }

  return createdNotifications
}

/**
 * スタッフ資格証の期限をチェックして通知を生成
 * （注: 現在のスキーマにはlicenseExpiryDateがないため、将来の拡張用）
 */
export async function checkLicenseExpiry(organizationId: string) {
  // TODO: usersテーブルにlicenseExpiryDateカラムを追加後に実装
  console.log("License expiry check - to be implemented")
  return []
}

/**
 * 異常アクセスを検知して通知を生成
 */
export async function checkAbnormalAccess(
  organizationId: string,
  userId: string,
  ipAddress: string,
  userAgent: string
) {
  const now = new Date()
  const currentHour = now.getHours()

  // 深夜（22時〜6時）のアクセスを検知
  const isNightTime = currentHour >= 22 || currentHour < 6

  if (isNightTime) {
    const admins = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.role, "ADMIN"),
          eq(users.active, true)
        )
      )

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length > 0) {
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          organizationId,
          type: "WARNING",
          category: "SECURITY_ALERT",
          title: "深夜時間帯のアクセス検知",
          message: `${user[0].name}（${user[0].email}）が深夜${currentHour}時にアクセスしました。IPアドレス: ${ipAddress}`,
          priority: "HIGH",
          relatedId: userId,
          relatedType: "USER",
          actionUrl: `/dashboard/activity`,
        })
      }
    }
  }
}

/**
 * 全ての監視項目をチェックして通知を生成
 */
export async function runAllNotificationChecks(organizationId: string) {
  console.log(`🔔 通知チェック開始: ${organizationId}`)

  const results = {
    consents: await checkConsentExpiry(organizationId),
    tasks: await checkTaskDueDate(organizationId),
    licenses: await checkLicenseExpiry(organizationId),
  }

  console.log(`✅ 通知チェック完了:`, {
    consentsCount: results.consents.length,
    tasksCount: results.tasks.length,
    licensesCount: results.licenses.length,
  })

  return results
}
