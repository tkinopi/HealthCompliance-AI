import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import {
  createIncident,
  getIncidents,
  getIncidentStats,
  searchIncidents,
} from "@/lib/incident-management"
import { analyzeIncident } from "@/lib/incident-ai"

/**
 * GET /api/incidents
 * インシデント一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // ユーザー情報を取得
    const userList = await db.select().from(users).where(eq(users.id, session.user.id))
    if (userList.length === 0) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const user = userList[0]
    const organizationId = user.organizationId

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const incidentType = searchParams.get("incidentType") || undefined
    const severity = searchParams.get("severity") || undefined
    const keyword = searchParams.get("keyword") || undefined
    const getStats = searchParams.get("stats") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // 統計情報のみを取得する場合
    if (getStats) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 6) // 過去6ヶ月

      const stats = await getIncidentStats(organizationId, startDate, endDate)
      return NextResponse.json({ success: true, stats })
    }

    // キーワード検索
    if (keyword) {
      const searchResults = await searchIncidents(organizationId, keyword, {
        limit,
        offset,
      })
      return NextResponse.json({
        success: true,
        incidents: searchResults,
        total: searchResults.length,
      })
    }

    // 通常の一覧取得
    const incidentList = await getIncidents(organizationId, {
      status,
      incidentType,
      severity,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      incidents: incidentList,
      total: incidentList.length,
    })
  } catch (error: any) {
    console.error("❌ [API] インシデント一覧取得エラー:", error)
    return NextResponse.json(
      { error: "インシデント一覧の取得に失敗しました", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/incidents
 * インシデントを作成
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // ユーザー情報を取得
    const userList = await db.select().from(users).where(eq(users.id, session.user.id))
    if (userList.length === 0) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    const user = userList[0]

    // リクエストボディを取得
    const body = await request.json()
    const {
      incidentType,
      title,
      description,
      severity,
      occurredAt,
      discoveredAt,
      location,
      affectedPatientId,
      analyzeWithAI,
    } = body

    // バリデーション
    if (!incidentType || !title || !description || !severity || !occurredAt || !discoveredAt) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      )
    }

    console.log(`📝 [API] インシデント作成リクエスト: ${title}`)

    // インシデントを作成
    const incident = await createIncident({
      incidentType,
      title,
      description,
      severity,
      occurredAt: new Date(occurredAt),
      discoveredAt: new Date(discoveredAt),
      location,
      affectedPatientId,
      reportedById: session.user.id,
      organizationId: user.organizationId,
    })

    // AI分析を実行（オプション）
    let analysis = null
    if (analyzeWithAI) {
      console.log(`🤖 [API] AI分析を実行中...`)
      analysis = await analyzeIncident({
        id: incident.id,
        incidentType,
        title,
        description,
        severity,
        organizationId: user.organizationId,
      })
    }

    return NextResponse.json({
      success: true,
      incident,
      analysis,
      message: "インシデントを作成しました",
    })
  } catch (error: any) {
    console.error("❌ [API] インシデント作成エラー:", error)
    return NextResponse.json(
      { error: "インシデントの作成に失敗しました", details: error.message },
      { status: 500 }
    )
  }
}
