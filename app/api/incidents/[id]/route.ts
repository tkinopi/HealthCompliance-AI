import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  getIncidentById,
  updateIncidentStatus,
  assignIncident,
  updateIncidentActions,
  createIncidentAction,
} from "@/lib/incident-management"
import { analyzeIncident, generateIncidentReport } from "@/lib/incident-ai"

/**
 * GET /api/incidents/[id]
 * インシデント詳細を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const incidentId = params.id

    const incident = await getIncidentById(incidentId)

    if (!incident) {
      return NextResponse.json(
        { error: "インシデントが見つかりません" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      incident,
    })
  } catch (error: any) {
    console.error("❌ [API] インシデント詳細取得エラー:", error)
    return NextResponse.json(
      { error: "インシデント詳細の取得に失敗しました", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/incidents/[id]
 * インシデントを更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const incidentId = params.id
    const body = await request.json()
    const { status, assignedToId, immediateActions, correctiveActions, preventiveMeasures } =
      body

    let updated = null

    // ステータス更新
    if (status) {
      updated = await updateIncidentStatus(incidentId, status, session.user.id)
    }

    // 担当者割り当て
    if (assignedToId) {
      updated = await assignIncident(incidentId, assignedToId, session.user.id)
    }

    // 対応策更新
    if (immediateActions || correctiveActions || preventiveMeasures) {
      updated = await updateIncidentActions(incidentId, {
        immediateActions,
        correctiveActions,
        preventiveMeasures,
      })
    }

    return NextResponse.json({
      success: true,
      incident: updated,
      message: "インシデントを更新しました",
    })
  } catch (error: any) {
    console.error("❌ [API] インシデント更新エラー:", error)
    return NextResponse.json(
      { error: "インシデントの更新に失敗しました", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/incidents/[id]
 * インシデントに対するアクションを実行
 *
 * body.action の値によって処理を分岐:
 * - "addAction": アクション追加
 * - "analyze": AI分析
 * - "generateReport": 報告書生成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const incidentId = params.id
    const body = await request.json()
    const { action } = body

    // アクション追加
    if (action === "addAction") {
      const { actionType, title, description } = body

      const newAction = await createIncidentAction({
        incidentId,
        actionType,
        title,
        description,
        performedById: session.user.id,
        performedAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        action: newAction,
        message: "アクションを追加しました",
      })
    }

    // AI分析
    if (action === "analyze") {
      const incident = await getIncidentById(incidentId)

      if (!incident) {
        return NextResponse.json(
          { error: "インシデントが見つかりません" },
          { status: 404 }
        )
      }

      const analysis = await analyzeIncident({
        id: incidentId,
        incidentType: incident.incident.incidentType,
        title: incident.incident.title,
        description: incident.incident.description,
        severity: incident.incident.severity,
        organizationId: incident.incident.organizationId,
      })

      return NextResponse.json({
        success: true,
        analysis,
        message: "AI分析が完了しました",
      })
    }

    // 報告書生成
    if (action === "generateReport") {
      const incident = await getIncidentById(incidentId)

      if (!incident) {
        return NextResponse.json(
          { error: "インシデントが見つかりません" },
          { status: 404 }
        )
      }

      const suggestedActions = incident.incident.aiSuggestions
        ? JSON.parse(incident.incident.aiSuggestions)
        : { immediate: [], corrective: [], preventive: [] }

      const report = await generateIncidentReport(
        {
          incidentNumber: incident.incident.incidentNumber,
          incidentType: incident.incident.incidentType,
          title: incident.incident.title,
          description: incident.incident.description,
          severity: incident.incident.severity,
          occurredAt: incident.incident.occurredAt,
          discoveredAt: incident.incident.discoveredAt,
          location: incident.incident.location,
          affectedPatient: incident.affectedPatient
            ? {
                patientNumber: incident.affectedPatient.patientNumber,
                lastName: incident.affectedPatient.lastName,
                firstName: incident.affectedPatient.firstName,
              }
            : undefined,
          reportedBy: {
            name: incident.reportedBy?.name || "不明",
            role: incident.reportedBy?.role || "不明",
          },
        },
        suggestedActions
      )

      return NextResponse.json({
        success: true,
        report,
        message: "報告書を生成しました",
      })
    }

    return NextResponse.json({ error: "無効なアクションです" }, { status: 400 })
  } catch (error: any) {
    console.error("❌ [API] インシデントアクションエラー:", error)
    return NextResponse.json(
      { error: "アクションの実行に失敗しました", details: error.message },
      { status: 500 }
    )
  }
}
