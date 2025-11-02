import { db } from "./db"
import { accessLogs, users, patientAssignments } from "@/db/schema"
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm"
import {
  getUserAccessLogs,
  getUserAccessStats,
  updateAnomalyScore,
  type DeviceInfo,
} from "./access-log"

/**
 * 異常検知エンジン
 * 統計的手法とルールベースのハイブリッドアプローチ
 */

export interface AnomalyDetectionResult {
  isAnomaly: boolean
  anomalyScore: number // 0-100
  reasons: string[]
  factors: {
    timeAnomaly: number
    volumeAnomaly: number
    patternAnomaly: number
    deviceAnomaly: number
    authorizationAnomaly: number
  }
}

export interface AnomalyThresholds {
  lateNightAccessScore: number // 深夜アクセスのスコア
  unusualDeviceScore: number // 異常デバイスのスコア
  bulkAccessScore: number // 大量アクセスのスコア
  unauthorizedAccessScore: number // 権限外アクセスのスコア
  standardDeviationThreshold: number // 標準偏差の閾値
}

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  lateNightAccessScore: 30,
  unusualDeviceScore: 25,
  bulkAccessScore: 40,
  unauthorizedAccessScore: 50,
  standardDeviationThreshold: 2.0, // 2σ以上を異常とする
}

/**
 * アクセスログを分析して異常を検知
 */
export async function detectAnomaly(
  logId: string,
  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS
): Promise<AnomalyDetectionResult> {
  try {
    // ログを取得
    const logs = await db.select().from(accessLogs).where(eq(accessLogs.id, logId))
    if (logs.length === 0) {
      throw new Error(`ログが見つかりません: ${logId}`)
    }

    const log = logs[0]
    const reasons: string[] = []
    const factors = {
      timeAnomaly: 0,
      volumeAnomaly: 0,
      patternAnomaly: 0,
      deviceAnomaly: 0,
      authorizationAnomaly: 0,
    }

    // 1. 時間帯による異常検知
    factors.timeAnomaly = await detectTimeAnomaly(log, thresholds)
    if (factors.timeAnomaly > 0) {
      reasons.push(`深夜または非営業時間のアクセス (スコア: ${factors.timeAnomaly})`)
    }

    // 2. アクセス量による異常検知
    factors.volumeAnomaly = await detectVolumeAnomaly(log, thresholds)
    if (factors.volumeAnomaly > 0) {
      reasons.push(`短時間での大量アクセス (スコア: ${factors.volumeAnomaly})`)
    }

    // 3. アクセスパターンによる異常検知（統計的手法）
    factors.patternAnomaly = await detectPatternAnomaly(log, thresholds)
    if (factors.patternAnomaly > 0) {
      reasons.push(`通常と異なるアクセスパターン (スコア: ${factors.patternAnomaly})`)
    }

    // 4. デバイスによる異常検知
    factors.deviceAnomaly = await detectDeviceAnomaly(log, thresholds)
    if (factors.deviceAnomaly > 0) {
      reasons.push(`通常と異なるデバイスからのアクセス (スコア: ${factors.deviceAnomaly})`)
    }

    // 5. 権限による異常検知
    factors.authorizationAnomaly = await detectAuthorizationAnomaly(log, thresholds)
    if (factors.authorizationAnomaly > 0) {
      reasons.push(`権限外リソースへのアクセス (スコア: ${factors.authorizationAnomaly})`)
    }

    // 総合スコア計算（重み付け平均）
    const anomalyScore = calculateWeightedScore(factors)

    // 異常判定（スコア50以上を異常とする）
    const isAnomaly = anomalyScore >= 50

    return {
      isAnomaly,
      anomalyScore,
      reasons,
      factors,
    }
  } catch (error) {
    console.error("❌ [ANOMALY] 異常検知エラー:", error)
    throw error
  }
}

/**
 * 時間帯による異常検知
 * 深夜（22:00-6:00）や休日のアクセスを検知
 */
async function detectTimeAnomaly(
  log: typeof accessLogs.$inferSelect,
  thresholds: AnomalyThresholds
): Promise<number> {
  const hour = log.createdAt.getHours()
  const day = log.createdAt.getDay()

  let score = 0

  // 深夜（22:00-6:00）のアクセス
  if (hour >= 22 || hour < 6) {
    score += thresholds.lateNightAccessScore
  }

  // 早朝（6:00-8:00）のアクセス（軽微）
  if (hour >= 6 && hour < 8) {
    score += thresholds.lateNightAccessScore * 0.3
  }

  // 深夜（20:00-22:00）のアクセス（軽微）
  if (hour >= 20 && hour < 22) {
    score += thresholds.lateNightAccessScore * 0.5
  }

  // 休日（土日）のアクセス
  if (day === 0 || day === 6) {
    score += thresholds.lateNightAccessScore * 0.5
  }

  return Math.min(score, 100)
}

/**
 * アクセス量による異常検知
 * 短時間での大量アクセスを検知
 */
async function detectVolumeAnomaly(
  log: typeof accessLogs.$inferSelect,
  thresholds: AnomalyThresholds
): Promise<number> {
  // 過去1時間のアクセス数を取得
  const oneHourAgo = new Date(log.createdAt.getTime() - 60 * 60 * 1000)
  const recentLogs = await db
    .select()
    .from(accessLogs)
    .where(
      and(
        eq(accessLogs.userId, log.userId),
        gte(accessLogs.createdAt, oneHourAgo),
        lte(accessLogs.createdAt, log.createdAt)
      )
    )

  const accessCount = recentLogs.length

  let score = 0

  // 1時間に50件以上のアクセス
  if (accessCount >= 50) {
    score += thresholds.bulkAccessScore
  }
  // 1時間に30-50件のアクセス
  else if (accessCount >= 30) {
    score += thresholds.bulkAccessScore * 0.7
  }
  // 1時間に20-30件のアクセス
  else if (accessCount >= 20) {
    score += thresholds.bulkAccessScore * 0.4
  }

  // 短時間（5分）での大量アクセス
  const fiveMinutesAgo = new Date(log.createdAt.getTime() - 5 * 60 * 1000)
  const recentLogsShort = recentLogs.filter((l) => l.createdAt >= fiveMinutesAgo)

  if (recentLogsShort.length >= 10) {
    score += thresholds.bulkAccessScore * 0.5
  }

  // エクスポートやプリントアクションの場合はスコアを増加
  if (log.action === "EXPORT" || log.action === "PRINT") {
    score *= 1.3
  }

  return Math.min(score, 100)
}

/**
 * アクセスパターンによる異常検知（統計的手法）
 * ユーザーの過去のアクセスパターンと比較して標準偏差を計算
 */
async function detectPatternAnomaly(
  log: typeof accessLogs.$inferSelect,
  thresholds: AnomalyThresholds
): Promise<number> {
  try {
    // 過去30日間のアクセス統計を取得
    const thirtyDaysAgo = new Date(log.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000)
    const stats = await getUserAccessStats(log.userId, thirtyDaysAgo, log.createdAt)

    if (stats.totalAccess < 10) {
      // データが少ない場合は統計的手法を使用しない
      return 0
    }

    let score = 0

    // 時間帯別アクセスの標準偏差を計算
    const hour = log.createdAt.getHours()
    const hourlyAverage = stats.totalAccess / 24
    const hourlyStdDev = calculateStandardDeviation(stats.hourlyAccess)
    const hourlyZScore = (stats.hourlyAccess[hour] - hourlyAverage) / (hourlyStdDev || 1)

    // 標準偏差が閾値以上の場合
    if (Math.abs(hourlyZScore) >= thresholds.standardDeviationThreshold) {
      score += 30
    }

    // アクセスタイプの偏り
    const actionCount = stats.actionCounts[log.action] || 0
    const actionRatio = actionCount / stats.totalAccess

    // 通常と異なるアクションタイプの場合
    if (actionRatio < 0.1 && stats.totalAccess > 20) {
      score += 20
    }

    // データサイズが通常より大きい場合
    if (log.dataSize && log.dataSize > 1024 * 1024 * 10) {
      // 10MB以上
      score += 25
    }

    return Math.min(score, 100)
  } catch (error) {
    console.error("❌ [ANOMALY] パターン異常検知エラー:", error)
    return 0
  }
}

/**
 * デバイスによる異常検知
 * 通常と異なるデバイスからのアクセスを検知
 */
async function detectDeviceAnomaly(
  log: typeof accessLogs.$inferSelect,
  thresholds: AnomalyThresholds
): Promise<number> {
  if (!log.deviceInfo) {
    return 0
  }

  try {
    const currentDevice = JSON.parse(log.deviceInfo) as DeviceInfo

    // 過去30日間のデバイス情報を取得
    const thirtyDaysAgo = new Date(log.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentLogs = await getUserAccessLogs(log.userId, {
      startDate: thirtyDaysAgo,
      endDate: log.createdAt,
      limit: 1000,
    })

    if (recentLogs.length < 5) {
      // データが少ない場合は判定しない
      return 0
    }

    // 過去のデバイスタイプを集計
    const deviceTypeCounts: Record<string, number> = {}
    const osCounts: Record<string, number> = {}
    const browserCounts: Record<string, number> = {}

    recentLogs.forEach((recentLog) => {
      if (recentLog.deviceInfo) {
        try {
          const device = JSON.parse(recentLog.deviceInfo) as DeviceInfo
          deviceTypeCounts[device.deviceType] = (deviceTypeCounts[device.deviceType] || 0) + 1
          osCounts[device.os] = (osCounts[device.os] || 0) + 1
          browserCounts[device.browser] = (browserCounts[device.browser] || 0) + 1
        } catch (e) {
          // パースエラーは無視
        }
      }
    })

    let score = 0

    // デバイスタイプが初めての場合
    if (!deviceTypeCounts[currentDevice.deviceType]) {
      score += thresholds.unusualDeviceScore
    }

    // OSが初めての場合
    if (!osCounts[currentDevice.os]) {
      score += thresholds.unusualDeviceScore * 0.8
    }

    // ブラウザが初めての場合
    if (!browserCounts[currentDevice.browser]) {
      score += thresholds.unusualDeviceScore * 0.5
    }

    // IPアドレスが変わった場合（簡易チェック）
    const recentIPs = recentLogs.map((l) => l.ipAddress).filter((ip) => ip !== null)
    const uniqueIPs = [...new Set(recentIPs)]

    if (log.ipAddress && !uniqueIPs.includes(log.ipAddress)) {
      score += thresholds.unusualDeviceScore * 0.6
    }

    return Math.min(score, 100)
  } catch (error) {
    console.error("❌ [ANOMALY] デバイス異常検知エラー:", error)
    return 0
  }
}

/**
 * 権限による異常検知
 * 担当外の患者情報へのアクセスや退職者のアクセスを検知
 */
async function detectAuthorizationAnomaly(
  log: typeof accessLogs.$inferSelect,
  thresholds: AnomalyThresholds
): Promise<number> {
  try {
    let score = 0

    // ユーザー情報を取得
    const userList = await db.select().from(users).where(eq(users.id, log.userId))
    if (userList.length === 0) {
      return 0
    }
    const user = userList[0]

    // 退職者（無効化されたユーザー）のアクセス
    if (!user.isActive) {
      score += thresholds.unauthorizedAccessScore
      return Math.min(score, 100)
    }

    // 患者リソースへのアクセスの場合、担当患者かチェック
    if (log.resourceType === "PATIENT") {
      const assignments = await db
        .select()
        .from(patientAssignments)
        .where(
          and(
            eq(patientAssignments.userId, log.userId),
            eq(patientAssignments.patientId, log.resourceId)
          )
        )

      // 担当患者でない場合
      if (assignments.length === 0) {
        score += thresholds.unauthorizedAccessScore * 0.8
      }
    }

    // 削除アクションの場合はスコアを増加
    if (log.action === "DELETE") {
      score += thresholds.unauthorizedAccessScore * 0.3
    }

    return Math.min(score, 100)
  } catch (error) {
    console.error("❌ [ANOMALY] 権限異常検知エラー:", error)
    return 0
  }
}

/**
 * 重み付けスコアを計算
 */
function calculateWeightedScore(factors: {
  timeAnomaly: number
  volumeAnomaly: number
  patternAnomaly: number
  deviceAnomaly: number
  authorizationAnomaly: number
}): number {
  const weights = {
    timeAnomaly: 0.15,
    volumeAnomaly: 0.25,
    patternAnomaly: 0.20,
    deviceAnomaly: 0.15,
    authorizationAnomaly: 0.25,
  }

  const score =
    factors.timeAnomaly * weights.timeAnomaly +
    factors.volumeAnomaly * weights.volumeAnomaly +
    factors.patternAnomaly * weights.patternAnomaly +
    factors.deviceAnomaly * weights.deviceAnomaly +
    factors.authorizationAnomaly * weights.authorizationAnomaly

  return Math.min(Math.round(score), 100)
}

/**
 * 標準偏差を計算
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length

  return Math.sqrt(variance)
}

/**
 * バッチ処理: 過去のアクセスログを分析して異常を検知
 */
export async function analyzeAccessLogs(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS
): Promise<{
  totalAnalyzed: number
  anomaliesDetected: number
  averageScore: number
}> {
  try {
    console.log(`🔍 [ANOMALY] バッチ分析開始: ${startDate.toISOString()} - ${endDate.toISOString()}`)

    // 対象期間のログを取得
    const logs = await db
      .select()
      .from(accessLogs)
      .where(
        and(
          eq(accessLogs.organizationId, organizationId),
          gte(accessLogs.createdAt, startDate),
          lte(accessLogs.createdAt, endDate),
          eq(accessLogs.isAnomaly, false) // まだ分析されていないログのみ
        )
      )
      .orderBy(desc(accessLogs.createdAt))

    let totalAnalyzed = 0
    let anomaliesDetected = 0
    let totalScore = 0

    // 各ログを分析
    for (const log of logs) {
      const result = await detectAnomaly(log.id, thresholds)

      // 異常スコアを更新
      await updateAnomalyScore(log.id, result.anomalyScore, result.isAnomaly, result.reasons)

      totalAnalyzed++
      if (result.isAnomaly) {
        anomaliesDetected++
      }
      totalScore += result.anomalyScore

      // 1000件ごとに進捗を出力
      if (totalAnalyzed % 1000 === 0) {
        console.log(`🔍 [ANOMALY] 分析進捗: ${totalAnalyzed}件`)
      }
    }

    const averageScore = totalAnalyzed > 0 ? totalScore / totalAnalyzed : 0

    console.log(`✅ [ANOMALY] バッチ分析完了: ${totalAnalyzed}件分析、${anomaliesDetected}件の異常を検知`)

    return {
      totalAnalyzed,
      anomaliesDetected,
      averageScore,
    }
  } catch (error) {
    console.error("❌ [ANOMALY] バッチ分析エラー:", error)
    throw error
  }
}
