import { db } from "./db"
import { users, accessLogs } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { detectAnomaly, type AnomalyDetectionResult } from "./anomaly-detection"
import { createNotification } from "./notifications"
import { recordAccessLog, type AccessLogData } from "./access-log"

/**
 * リアルタイム異常検知アラート生成
 * アクセスログを記録し、異常を検知した場合は即座に通知を生成
 */

export interface AlertConfig {
  enableRealTimeAlerts: boolean
  alertThreshold: number // 異常スコアの閾値（この値以上でアラート生成）
  notifyAdminsOnly: boolean // 管理者のみに通知するか
  notifyUser: boolean // アクセスしたユーザー本人にも通知するか
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enableRealTimeAlerts: true,
  alertThreshold: 50, // スコア50以上で通知
  notifyAdminsOnly: true,
  notifyUser: false,
}

/**
 * アクセスログを記録し、リアルタイムで異常検知とアラート生成を実行
 */
export async function recordAccessAndDetectAnomaly(
  data: AccessLogData,
  config: AlertConfig = DEFAULT_ALERT_CONFIG
): Promise<{
  logId: string
  anomalyResult: AnomalyDetectionResult | null
  alertsCreated: number
}> {
  try {
    // 1. アクセスログを記録
    const logId = await recordAccessLog(data)

    // リアルタイムアラートが無効の場合は、ログ記録のみ
    if (!config.enableRealTimeAlerts) {
      return {
        logId,
        anomalyResult: null,
        alertsCreated: 0,
      }
    }

    // 2. 異常検知を実行
    const anomalyResult = await detectAnomaly(logId)

    // 3. 異常スコアが閾値以上の場合、アラートを生成
    let alertsCreated = 0
    if (anomalyResult.anomalyScore >= config.alertThreshold) {
      alertsCreated = await generateAnomalyAlerts(
        logId,
        data,
        anomalyResult,
        config
      )
    }

    return {
      logId,
      anomalyResult,
      alertsCreated,
    }
  } catch (error) {
    console.error("❌ [ALERT] アクセス記録・異常検知エラー:", error)
    throw error
  }
}

/**
 * 異常検知結果に基づいてアラートを生成
 */
async function generateAnomalyAlerts(
  logId: string,
  accessData: AccessLogData,
  anomalyResult: AnomalyDetectionResult,
  config: AlertConfig
): Promise<number> {
  try {
    let alertCount = 0

    // ユーザー情報を取得
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, accessData.userId))

    if (userList.length === 0) {
      console.warn(`⚠️ [ALERT] ユーザーが見つかりません: ${accessData.userId}`)
      return 0
    }

    const user = userList[0]

    // 重要度を判定
    const priority = getPriorityFromScore(anomalyResult.anomalyScore)
    const type = getNotificationTypeFromScore(anomalyResult.anomalyScore)

    // アラートメッセージを作成
    const title = getAlertTitle(anomalyResult)
    const message = getAlertMessage(user, accessData, anomalyResult)

    // 管理者に通知
    if (config.notifyAdminsOnly || anomalyResult.anomalyScore >= 70) {
      const admins = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.organizationId, accessData.organizationId),
            eq(users.role, "ADMIN"),
            eq(users.active, true)
          )
        )

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          organizationId: accessData.organizationId,
          type,
          category: "SECURITY_ALERT",
          title: `【セキュリティアラート】${title}`,
          message,
          priority,
          relatedId: logId,
          relatedType: "ACCESS_LOG",
          actionUrl: `/dashboard/security/logs/${logId}`,
        })
        alertCount++
      }
    }

    // ユーザー本人に通知（設定が有効かつスコアが中程度の場合）
    if (config.notifyUser && anomalyResult.anomalyScore >= 50 && anomalyResult.anomalyScore < 80) {
      await createNotification({
        userId: accessData.userId,
        organizationId: accessData.organizationId,
        type: "INFO",
        category: "SECURITY_ALERT",
        title: "通常と異なるアクセスパターンが検知されました",
        message: `ご自身のアクセスに問題がないかご確認ください。検知時刻: ${new Date().toLocaleString("ja-JP")}`,
        priority: "MEDIUM",
        relatedId: logId,
        relatedType: "ACCESS_LOG",
        actionUrl: "/dashboard/security/my-activity",
      })
      alertCount++
    }

    console.log(
      `🚨 [ALERT] 異常アラート生成完了: ${alertCount}件 (スコア: ${anomalyResult.anomalyScore})`
    )

    return alertCount
  } catch (error) {
    console.error("❌ [ALERT] アラート生成エラー:", error)
    throw error
  }
}

/**
 * 異常スコアから優先度を判定
 */
function getPriorityFromScore(score: number): "LOW" | "MEDIUM" | "HIGH" | "URGENT" {
  if (score >= 80) return "URGENT"
  if (score >= 70) return "HIGH"
  if (score >= 50) return "MEDIUM"
  return "LOW"
}

/**
 * 異常スコアから通知タイプを判定
 */
function getNotificationTypeFromScore(score: number): "INFO" | "WARNING" | "URGENT" {
  if (score >= 80) return "URGENT"
  if (score >= 60) return "WARNING"
  return "INFO"
}

/**
 * アラートタイトルを生成
 */
function getAlertTitle(anomalyResult: AnomalyDetectionResult): string {
  const { factors } = anomalyResult

  // 最も高いスコアの要因をタイトルに
  const maxFactor = Object.entries(factors).reduce((max, [key, value]) =>
    value > max.value ? { key, value } : max
  , { key: "", value: 0 })

  switch (maxFactor.key) {
    case "timeAnomaly":
      return "深夜または非営業時間のアクセス"
    case "volumeAnomaly":
      return "短時間での大量アクセス"
    case "patternAnomaly":
      return "通常と異なるアクセスパターン"
    case "deviceAnomaly":
      return "通常と異なるデバイスからのアクセス"
    case "authorizationAnomaly":
      return "権限外リソースへのアクセス"
    default:
      return "異常なアクセスパターン"
  }
}

/**
 * アラートメッセージを生成
 */
function getAlertMessage(
  user: typeof users.$inferSelect,
  accessData: AccessLogData,
  anomalyResult: AnomalyDetectionResult
): string {
  const timestamp = new Date().toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  let message = `ユーザー: ${user.name} (${user.email})\n`
  message += `アクション: ${accessData.action} ${accessData.resourceType}\n`
  message += `時刻: ${timestamp}\n`
  message += `異常スコア: ${anomalyResult.anomalyScore}/100\n`

  if (accessData.ipAddress) {
    message += `IPアドレス: ${accessData.ipAddress}\n`
  }

  if (anomalyResult.reasons.length > 0) {
    message += `\n検知された異常:\n`
    anomalyResult.reasons.forEach((reason, index) => {
      message += `${index + 1}. ${reason}\n`
    })
  }

  message += `\n詳細はセキュリティログをご確認ください。`

  return message
}

/**
 * 高リスクアクセスを即座に検知してアラート生成
 * （権限外アクセス、削除アクション、大量エクスポートなど）
 */
export async function detectHighRiskAccess(
  data: AccessLogData
): Promise<boolean> {
  let isHighRisk = false

  // 削除アクション
  if (data.action === "DELETE") {
    isHighRisk = true
  }

  // 大量データのエクスポート
  if (data.action === "EXPORT" && data.dataSize && data.dataSize > 1024 * 1024 * 50) {
    // 50MB以上
    isHighRisk = true
  }

  // 深夜の患者情報アクセス
  const hour = new Date().getHours()
  if ((hour >= 22 || hour < 6) && data.resourceType === "PATIENT") {
    isHighRisk = true
  }

  if (isHighRisk) {
    console.log(`⚠️ [ALERT] 高リスクアクセス検知: ${data.action} ${data.resourceType}`)

    // 即座に管理者に通知
    const admins = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, data.organizationId),
          eq(users.role, "ADMIN"),
          eq(users.active, true)
        )
      )

    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))

    if (userList.length > 0) {
      const user = userList[0]

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          organizationId: data.organizationId,
          type: "URGENT",
          category: "SECURITY_ALERT",
          title: "【緊急】高リスクアクセス検知",
          message: `ユーザー「${user.name}」が高リスクアクション（${data.action} ${data.resourceType}）を実行しました。\n時刻: ${new Date().toLocaleString("ja-JP")}\nIPアドレス: ${data.ipAddress || "不明"}`,
          priority: "URGENT",
          relatedId: data.userId,
          relatedType: "ACCESS_LOG",
          actionUrl: "/dashboard/security",
        })
      }
    }
  }

  return isHighRisk
}

/**
 * 複数回の異常アクセスを検知してエスカレーション
 * （同一ユーザーが短時間に複数回異常アクセスを行った場合）
 */
export async function checkRepeatedAnomalies(
  userId: string,
  organizationId: string
): Promise<void> {
  try {
    // 過去24時間の異常アクセスを取得
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const anomalousLogs = await db
      .select()
      .from(accessLogs)
      .where(
        and(
          eq(accessLogs.userId, userId),
          eq(accessLogs.organizationId, organizationId),
          eq(accessLogs.isAnomaly, true),
          and(
            accessLogs.createdAt >= twentyFourHoursAgo,
            accessLogs.createdAt <= new Date()
          )
        )
      )

    // 5回以上の異常アクセスがある場合、エスカレーション
    if (anomalousLogs.length >= 5) {
      console.log(`🚨 [ALERT] 繰り返し異常検知: ユーザー ${userId} (${anomalousLogs.length}回)`)

      const userList = await db.select().from(users).where(eq(users.id, userId))
      if (userList.length === 0) return

      const user = userList[0]

      // 全管理者に緊急通知
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
          type: "URGENT",
          category: "SECURITY_ALERT",
          title: "【緊急】繰り返し異常アクセス検知",
          message: `ユーザー「${user.name} (${user.email})」が24時間以内に${anomalousLogs.length}回の異常アクセスを行いました。\nアカウントの一時停止を検討してください。`,
          priority: "URGENT",
          relatedId: userId,
          relatedType: "USER",
          actionUrl: `/dashboard/users/${userId}`,
        })
      }
    }
  } catch (error) {
    console.error("❌ [ALERT] 繰り返し異常チェックエラー:", error)
  }
}
