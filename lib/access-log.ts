import { db } from "./db"
import { accessLogs } from "@/db/schema"
import { eq, and, gte, lte, desc, sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

/**
 * アクセスログ記録のためのユーティリティ関数
 */

export type ResourceType = "PATIENT" | "CONSENT" | "RECORD" | "TASK" | "DOCUMENT"
export type AccessAction = "VIEW" | "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "PRINT"

export interface AccessLogData {
  userId: string
  resourceType: ResourceType
  resourceId: string
  action: AccessAction
  ipAddress?: string
  userAgent?: string
  accessDuration?: number // seconds
  dataSize?: number // bytes
  organizationId: string
}

export interface DeviceInfo {
  deviceType: string // "desktop", "mobile", "tablet"
  os: string // "Windows", "macOS", "iOS", "Android", "Linux"
  browser: string // "Chrome", "Firefox", "Safari", "Edge"
  isUnusual: boolean // 通常と異なるデバイス
}

/**
 * アクセスログを記録
 */
export async function recordAccessLog(data: AccessLogData): Promise<string> {
  try {
    const deviceInfo = data.userAgent ? extractDeviceInfo(data.userAgent) : null

    const logId = createId()

    await db.insert(accessLogs).values({
      id: logId,
      userId: data.userId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
      accessDuration: data.accessDuration,
      dataSize: data.dataSize,
      anomalyScore: 0, // 初期値（後で異常検知エンジンが更新）
      isAnomaly: false,
      anomalyReasons: null,
      organizationId: data.organizationId,
    })

    console.log(`📊 [ACCESS LOG] 記録完了: ${data.action} ${data.resourceType}/${data.resourceId} by ${data.userId}`)

    return logId
  } catch (error) {
    console.error("❌ [ACCESS LOG] 記録エラー:", error)
    throw error
  }
}

/**
 * User Agentからデバイス情報を抽出
 */
export function extractDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase()

  // デバイスタイプ判定
  let deviceType = "desktop"
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
    deviceType = "tablet"
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/.test(userAgent)) {
    deviceType = "mobile"
  }

  // OS判定
  let os = "Unknown"
  if (ua.includes("windows")) os = "Windows"
  else if (ua.includes("mac os x")) os = "macOS"
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS"
  else if (ua.includes("android")) os = "Android"
  else if (ua.includes("linux")) os = "Linux"

  // ブラウザ判定
  let browser = "Unknown"
  if (ua.includes("edg/")) browser = "Edge"
  else if (ua.includes("chrome")) browser = "Chrome"
  else if (ua.includes("firefox")) browser = "Firefox"
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari"
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera"

  // 通常と異なるデバイスかどうか（後で機械学習で判定）
  const isUnusual = false // 初期値

  return {
    deviceType,
    os,
    browser,
    isUnusual,
  }
}

/**
 * ユーザーのアクセスログを取得
 */
export async function getUserAccessLogs(
  userId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    resourceType?: ResourceType
    limit?: number
  }
) {
  try {
    const conditions = [eq(accessLogs.userId, userId)]

    if (options?.startDate) {
      conditions.push(gte(accessLogs.createdAt, options.startDate))
    }

    if (options?.endDate) {
      conditions.push(lte(accessLogs.createdAt, options.endDate))
    }

    if (options?.resourceType) {
      conditions.push(eq(accessLogs.resourceType, options.resourceType))
    }

    const logs = await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .orderBy(desc(accessLogs.createdAt))
      .limit(options?.limit || 100)

    return logs
  } catch (error) {
    console.error("❌ [ACCESS LOG] 取得エラー:", error)
    throw error
  }
}

/**
 * リソースのアクセスログを取得
 */
export async function getResourceAccessLogs(
  resourceType: ResourceType,
  resourceId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    limit?: number
  }
) {
  try {
    const conditions = [
      eq(accessLogs.resourceType, resourceType),
      eq(accessLogs.resourceId, resourceId),
    ]

    if (options?.startDate) {
      conditions.push(gte(accessLogs.createdAt, options.startDate))
    }

    if (options?.endDate) {
      conditions.push(lte(accessLogs.createdAt, options.endDate))
    }

    const logs = await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .orderBy(desc(accessLogs.createdAt))
      .limit(options?.limit || 100)

    return logs
  } catch (error) {
    console.error("❌ [ACCESS LOG] 取得エラー:", error)
    throw error
  }
}

/**
 * 異常なアクセスログを取得
 */
export async function getAnomalousAccessLogs(
  organizationId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    minScore?: number
    limit?: number
  }
) {
  try {
    const conditions = [
      eq(accessLogs.organizationId, organizationId),
      eq(accessLogs.isAnomaly, true),
    ]

    if (options?.startDate) {
      conditions.push(gte(accessLogs.createdAt, options.startDate))
    }

    if (options?.endDate) {
      conditions.push(lte(accessLogs.createdAt, options.endDate))
    }

    if (options?.minScore) {
      conditions.push(gte(accessLogs.anomalyScore, options.minScore))
    }

    const logs = await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .orderBy(desc(accessLogs.anomalyScore), desc(accessLogs.createdAt))
      .limit(options?.limit || 100)

    return logs
  } catch (error) {
    console.error("❌ [ACCESS LOG] 異常ログ取得エラー:", error)
    throw error
  }
}

/**
 * ユーザーのアクセス統計を取得
 */
export async function getUserAccessStats(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const logs = await getUserAccessLogs(userId, { startDate, endDate, limit: 10000 })

    // 時間帯別アクセス数
    const hourlyAccess = new Array(24).fill(0)
    logs.forEach((log) => {
      const hour = log.createdAt.getHours()
      hourlyAccess[hour]++
    })

    // アクション別集計
    const actionCounts: Record<string, number> = {}
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })

    // リソースタイプ別集計
    const resourceTypeCounts: Record<string, number> = {}
    logs.forEach((log) => {
      resourceTypeCounts[log.resourceType] = (resourceTypeCounts[log.resourceType] || 0) + 1
    })

    // デバイス情報集計
    const deviceTypes: Record<string, number> = {}
    logs.forEach((log) => {
      if (log.deviceInfo) {
        try {
          const device = JSON.parse(log.deviceInfo) as DeviceInfo
          deviceTypes[device.deviceType] = (deviceTypes[device.deviceType] || 0) + 1
        } catch (e) {
          // パースエラーは無視
        }
      }
    })

    // 平均アクセス時間
    const averageAccessDuration =
      logs.filter((log) => log.accessDuration !== null).reduce((sum, log) => sum + (log.accessDuration || 0), 0) /
        logs.filter((log) => log.accessDuration !== null).length || 0

    return {
      totalAccess: logs.length,
      hourlyAccess,
      actionCounts,
      resourceTypeCounts,
      deviceTypes,
      averageAccessDuration,
      anomalousAccessCount: logs.filter((log) => log.isAnomaly).length,
      averageAnomalyScore:
        logs.reduce((sum, log) => sum + (log.anomalyScore || 0), 0) / logs.length || 0,
    }
  } catch (error) {
    console.error("❌ [ACCESS LOG] 統計取得エラー:", error)
    throw error
  }
}

/**
 * アクセスログに異常スコアを更新
 */
export async function updateAnomalyScore(
  logId: string,
  anomalyScore: number,
  isAnomaly: boolean,
  anomalyReasons: string[]
) {
  try {
    await db
      .update(accessLogs)
      .set({
        anomalyScore,
        isAnomaly,
        anomalyReasons: JSON.stringify(anomalyReasons),
      })
      .where(eq(accessLogs.id, logId))

    if (isAnomaly) {
      console.log(`⚠️ [ACCESS LOG] 異常検知: ${logId} (スコア: ${anomalyScore})`)
    }
  } catch (error) {
    console.error("❌ [ACCESS LOG] 異常スコア更新エラー:", error)
    throw error
  }
}

/**
 * 組織全体のアクセス統計を取得（ダッシュボード用）
 */
export async function getOrganizationAccessStats(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const result = await db
      .select({
        totalAccess: sql<number>`count(*)`,
        totalAnomaly: sql<number>`count(*) filter (where ${accessLogs.isAnomaly} = true)`,
        averageAnomalyScore: sql<number>`avg(${accessLogs.anomalyScore})`,
        uniqueUsers: sql<number>`count(distinct ${accessLogs.userId})`,
        uniqueResources: sql<number>`count(distinct ${accessLogs.resourceId})`,
      })
      .from(accessLogs)
      .where(
        and(
          eq(accessLogs.organizationId, organizationId),
          gte(accessLogs.createdAt, startDate),
          lte(accessLogs.createdAt, endDate)
        )
      )

    return result[0] || {
      totalAccess: 0,
      totalAnomaly: 0,
      averageAnomalyScore: 0,
      uniqueUsers: 0,
      uniqueResources: 0,
    }
  } catch (error) {
    console.error("❌ [ACCESS LOG] 組織統計取得エラー:", error)
    throw error
  }
}

/**
 * Next.js リクエストからアクセスログデータを抽出
 */
export function extractAccessLogFromRequest(request: Request): {
  ipAddress: string
  userAgent: string
} {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"

  const userAgent = request.headers.get("user-agent") || "unknown"

  return { ipAddress, userAgent }
}
