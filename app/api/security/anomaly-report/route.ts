import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { accessLogs, users } from "@/db/schema"
import { eq, and, gte, lte, desc, sql } from "drizzle-orm"
import { getAnomalousAccessLogs, getOrganizationAccessStats } from "@/lib/access-log"

/**
 * GET /api/security/anomaly-report
 * 異常検知レポートを生成
 *
 * Query Parameters:
 * - period: "daily" | "weekly" | "monthly"
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - format: "json" | "csv" (optional, default: "json")
 * - minScore: minimum anomaly score (optional, default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 管理者のみアクセス可能
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))

    if (userList.length === 0 || userList[0].role !== "ADMIN") {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      )
    }

    const user = userList[0]
    const organizationId = user.organizationId

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "weekly"
    const format = searchParams.get("format") || "json"
    const minScore = parseInt(searchParams.get("minScore") || "50")

    // 期間を計算
    let startDate: Date
    let endDate = new Date()

    if (searchParams.get("startDate") && searchParams.get("endDate")) {
      startDate = new Date(searchParams.get("startDate")!)
      endDate = new Date(searchParams.get("endDate")!)
    } else {
      // 期間に基づいて自動計算
      switch (period) {
        case "daily":
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
          break
        case "weekly":
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "monthly":
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
    }

    console.log(`📊 [REPORT] レポート生成: ${period} (${startDate.toISOString()} - ${endDate.toISOString()})`)

    // レポートを生成
    const report = await generateAnomalyReport(
      organizationId,
      startDate,
      endDate,
      minScore
    )

    // 形式に応じて返す
    if (format === "csv") {
      const csv = convertReportToCSV(report)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="anomaly-report-${period}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      report,
    })
  } catch (error) {
    console.error("❌ [REPORT] レポート生成エラー:", error)
    return NextResponse.json(
      { error: "レポートの生成に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 異常検知レポートを生成
 */
async function generateAnomalyReport(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  minScore: number
) {
  // 1. 全体統計を取得
  const overallStats = await getOrganizationAccessStats(
    organizationId,
    startDate,
    endDate
  )

  // 2. 異常アクセスログを取得
  const anomalousLogs = await getAnomalousAccessLogs(organizationId, {
    startDate,
    endDate,
    minScore,
    limit: 1000,
  })

  // 3. ユーザー別の異常回数を集計
  const userAnomalyCount: Record<string, {
    count: number
    totalScore: number
    userName: string
    userEmail: string
  }> = {}

  for (const log of anomalousLogs) {
    if (!userAnomalyCount[log.userId]) {
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.id, log.userId))

      userAnomalyCount[log.userId] = {
        count: 0,
        totalScore: 0,
        userName: userList[0]?.name || "不明",
        userEmail: userList[0]?.email || "不明",
      }
    }

    userAnomalyCount[log.userId].count++
    userAnomalyCount[log.userId].totalScore += log.anomalyScore || 0
  }

  // ユーザー別異常回数でソート
  const topAnomalousUsers = Object.entries(userAnomalyCount)
    .map(([userId, data]) => ({
      userId,
      ...data,
      averageScore: data.totalScore / data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 4. 時間帯別の異常発生回数を集計
  const hourlyAnomalies = new Array(24).fill(0)
  anomalousLogs.forEach((log) => {
    const hour = log.createdAt.getHours()
    hourlyAnomalies[hour]++
  })

  // 5. 異常理由別の集計
  const anomalyReasonCounts: Record<string, number> = {}
  anomalousLogs.forEach((log) => {
    if (log.anomalyReasons) {
      try {
        const reasons = JSON.parse(log.anomalyReasons) as string[]
        reasons.forEach((reason) => {
          // 括弧内のスコアを除去してカテゴライズ
          const category = reason.split("(")[0].trim()
          anomalyReasonCounts[category] = (anomalyReasonCounts[category] || 0) + 1
        })
      } catch (e) {
        // パースエラーは無視
      }
    }
  })

  const topReasons = Object.entries(anomalyReasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 6. リソースタイプ別の異常アクセス
  const resourceTypeAnomalies: Record<string, number> = {}
  anomalousLogs.forEach((log) => {
    resourceTypeAnomalies[log.resourceType] = (resourceTypeAnomalies[log.resourceType] || 0) + 1
  })

  // 7. 日別の異常発生推移
  const dailyTrend: Record<string, number> = {}
  anomalousLogs.forEach((log) => {
    const date = log.createdAt.toISOString().split("T")[0]
    dailyTrend[date] = (dailyTrend[date] || 0) + 1
  })

  // 8. 重大度別の集計
  const severityDistribution = {
    critical: anomalousLogs.filter((log) => (log.anomalyScore || 0) >= 80).length,
    high: anomalousLogs.filter((log) => (log.anomalyScore || 0) >= 70 && (log.anomalyScore || 0) < 80).length,
    medium: anomalousLogs.filter((log) => (log.anomalyScore || 0) >= 50 && (log.anomalyScore || 0) < 70).length,
    low: anomalousLogs.filter((log) => (log.anomalyScore || 0) < 50).length,
  }

  // 9. 最近の重大な異常（スコア80以上）
  const criticalAnomalies = anomalousLogs
    .filter((log) => (log.anomalyScore || 0) >= 80)
    .slice(0, 20)
    .map(async (log) => {
      const userList = await db.select().from(users).where(eq(users.id, log.userId))
      return {
        timestamp: log.createdAt.toISOString(),
        userId: log.userId,
        userName: userList[0]?.name || "不明",
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        action: log.action,
        anomalyScore: log.anomalyScore,
        reasons: log.anomalyReasons ? JSON.parse(log.anomalyReasons) : [],
        ipAddress: log.ipAddress,
      }
    })

  const criticalAnomaliesResolved = await Promise.all(criticalAnomalies)

  return {
    summary: {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      },
      totalAccess: overallStats.totalAccess,
      totalAnomalies: overallStats.totalAnomaly,
      anomalyRate: overallStats.totalAccess > 0
        ? ((overallStats.totalAnomaly / overallStats.totalAccess) * 100).toFixed(2) + "%"
        : "0%",
      averageAnomalyScore: overallStats.averageAnomalyScore?.toFixed(2) || 0,
      uniqueUsersWithAnomalies: Object.keys(userAnomalyCount).length,
    },
    severityDistribution,
    topAnomalousUsers,
    hourlyDistribution: hourlyAnomalies.map((count, hour) => ({
      hour: `${hour}:00`,
      count,
    })),
    dailyTrend: Object.entries(dailyTrend).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date)),
    topReasons,
    resourceTypeDistribution: Object.entries(resourceTypeAnomalies).map(
      ([type, count]) => ({ type, count })
    ).sort((a, b) => b.count - a.count),
    criticalAnomalies: criticalAnomaliesResolved,
    recommendations: generateRecommendations(
      overallStats,
      topAnomalousUsers,
      topReasons,
      severityDistribution
    ),
  }
}

/**
 * レポートに基づいて推奨事項を生成
 */
function generateRecommendations(
  stats: any,
  topUsers: any[],
  topReasons: any[],
  severity: any
): string[] {
  const recommendations: string[] = []

  // 異常率が高い場合
  const anomalyRate = stats.totalAccess > 0
    ? (stats.totalAnomaly / stats.totalAccess) * 100
    : 0

  if (anomalyRate > 10) {
    recommendations.push("異常アクセス率が10%を超えています。アクセス制御の見直しを推奨します。")
  }

  // 重大な異常が多い場合
  if (severity.critical > 10) {
    recommendations.push(`重大な異常（スコア80以上）が${severity.critical}件検出されています。早急な対応が必要です。`)
  }

  // 特定のユーザーに異常が集中している場合
  if (topUsers.length > 0 && topUsers[0].count > 10) {
    recommendations.push(
      `ユーザー「${topUsers[0].userName}」の異常アクセスが${topUsers[0].count}件と多数検出されています。アカウントの確認を推奨します。`
    )
  }

  // 深夜アクセスが多い場合
  const lateNightReason = topReasons.find((r) =>
    r.reason.includes("深夜") || r.reason.includes("非営業時間")
  )
  if (lateNightReason && lateNightReason.count > 5) {
    recommendations.push("深夜・非営業時間のアクセスが多数検出されています。アクセス時間帯の制限を検討してください。")
  }

  // 権限外アクセスが多い場合
  const unauthorizedReason = topReasons.find((r) =>
    r.reason.includes("権限外")
  )
  if (unauthorizedReason && unauthorizedReason.count > 3) {
    recommendations.push("権限外リソースへのアクセスが検出されています。ロール設定の見直しを推奨します。")
  }

  // デバイス異常が多い場合
  const deviceReason = topReasons.find((r) =>
    r.reason.includes("デバイス")
  )
  if (deviceReason && deviceReason.count > 5) {
    recommendations.push("通常と異なるデバイスからのアクセスが多数検出されています。多要素認証の導入を推奨します。")
  }

  if (recommendations.length === 0) {
    recommendations.push("現在、重大なセキュリティリスクは検出されていません。引き続き監視を継続してください。")
  }

  return recommendations
}

/**
 * レポートをCSV形式に変換
 */
function convertReportToCSV(report: any): string {
  let csv = "\uFEFF" // UTF-8 BOM

  // サマリー
  csv += "=== 異常検知レポート ===\n"
  csv += `期間,${report.summary.period.start} - ${report.summary.period.end}\n`
  csv += `総アクセス数,${report.summary.totalAccess}\n`
  csv += `異常アクセス数,${report.summary.totalAnomalies}\n`
  csv += `異常率,${report.summary.anomalyRate}\n`
  csv += `平均異常スコア,${report.summary.averageAnomalyScore}\n`
  csv += "\n"

  // 重大度分布
  csv += "=== 重大度別分布 ===\n"
  csv += "重大度,件数\n"
  csv += `緊急（80以上）,${report.severityDistribution.critical}\n`
  csv += `高（70-79）,${report.severityDistribution.high}\n`
  csv += `中（50-69）,${report.severityDistribution.medium}\n`
  csv += `低（50未満）,${report.severityDistribution.low}\n`
  csv += "\n"

  // 上位異常ユーザー
  csv += "=== 異常アクセスが多いユーザー ===\n"
  csv += "ユーザー名,メール,異常回数,平均スコア\n"
  report.topAnomalousUsers.forEach((user: any) => {
    csv += `${user.userName},${user.userEmail},${user.count},${user.averageScore.toFixed(2)}\n`
  })
  csv += "\n"

  // 推奨事項
  csv += "=== 推奨事項 ===\n"
  report.recommendations.forEach((rec: string, index: number) => {
    csv += `${index + 1},${rec}\n`
  })

  return csv
}
