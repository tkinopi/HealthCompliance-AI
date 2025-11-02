import { db } from "./db"
import { incidents, incidentActions, users, patients } from "@/db/schema"
import { eq, and, desc, gte, lte, or, like } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

/**
 * インシデント管理ユーティリティ
 */

export interface CreateIncidentData {
  incidentType: string
  title: string
  description: string
  severity: string
  occurredAt: Date
  discoveredAt: Date
  location?: string
  affectedPatientId?: string
  reportedById: string
  organizationId: string
}

export interface CreateIncidentActionData {
  incidentId: string
  actionType: string
  title: string
  description: string
  performedById: string
  performedAt: Date
}

/**
 * インシデント番号を生成（INC-YYYYMMDD-XXXX形式）
 */
export async function generateIncidentNumber(organizationId: string): Promise<string> {
  const now = new Date()
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, "")

  // 今日作成されたインシデントの数を取得
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const todayIncidents = await db
    .select()
    .from(incidents)
    .where(
      and(
        eq(incidents.organizationId, organizationId),
        gte(incidents.createdAt, todayStart),
        lte(incidents.createdAt, todayEnd)
      )
    )

  const sequence = (todayIncidents.length + 1).toString().padStart(4, "0")

  return `INC-${dateStr}-${sequence}`
}

/**
 * インシデントを作成
 */
export async function createIncident(data: CreateIncidentData) {
  try {
    const incidentNumber = await generateIncidentNumber(data.organizationId)

    const [incident] = await db
      .insert(incidents)
      .values({
        incidentNumber,
        incidentType: data.incidentType,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: "REPORTED",
        occurredAt: data.occurredAt,
        discoveredAt: data.discoveredAt,
        location: data.location,
        affectedPatientId: data.affectedPatientId,
        reportedById: data.reportedById,
        organizationId: data.organizationId,
        immediateActions: JSON.stringify([]), // 空配列で初期化
        correctiveActions: JSON.stringify([]),
        preventiveMeasures: JSON.stringify([]),
        evidenceUrls: JSON.stringify([]),
      })
      .returning()

    console.log(`📝 [INCIDENT] インシデント作成: ${incident.incidentNumber}`)

    return incident
  } catch (error) {
    console.error("❌ [INCIDENT] インシデント作成エラー:", error)
    throw error
  }
}

/**
 * インシデントアクションを追加（タイムライン）
 */
export async function createIncidentAction(data: CreateIncidentActionData) {
  try {
    const [action] = await db
      .insert(incidentActions)
      .values({
        incidentId: data.incidentId,
        actionType: data.actionType,
        title: data.title,
        description: data.description,
        performedById: data.performedById,
        performedAt: data.performedAt,
        isCompleted: false,
        evidenceUrls: JSON.stringify([]),
      })
      .returning()

    console.log(`✅ [INCIDENT] アクション追加: ${action.title}`)

    return action
  } catch (error) {
    console.error("❌ [INCIDENT] アクション追加エラー:", error)
    throw error
  }
}

/**
 * インシデント一覧を取得
 */
export async function getIncidents(
  organizationId: string,
  options?: {
    status?: string
    incidentType?: string
    severity?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
) {
  try {
    const conditions = [eq(incidents.organizationId, organizationId)]

    if (options?.status) {
      conditions.push(eq(incidents.status, options.status))
    }

    if (options?.incidentType) {
      conditions.push(eq(incidents.incidentType, options.incidentType))
    }

    if (options?.severity) {
      conditions.push(eq(incidents.severity, options.severity))
    }

    if (options?.startDate) {
      conditions.push(gte(incidents.occurredAt, options.startDate))
    }

    if (options?.endDate) {
      conditions.push(lte(incidents.occurredAt, options.endDate))
    }

    const incidentList = await db
      .select({
        incident: incidents,
        reportedBy: users,
        assignedTo: users,
        affectedPatient: patients,
      })
      .from(incidents)
      .leftJoin(users, eq(incidents.reportedById, users.id))
      .leftJoin(patients, eq(incidents.affectedPatientId, patients.id))
      .where(and(...conditions))
      .orderBy(desc(incidents.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0)

    return incidentList
  } catch (error) {
    console.error("❌ [INCIDENT] 一覧取得エラー:", error)
    throw error
  }
}

/**
 * インシデント詳細を取得
 */
export async function getIncidentById(incidentId: string) {
  try {
    const [result] = await db
      .select({
        incident: incidents,
        reportedBy: users,
        affectedPatient: patients,
      })
      .from(incidents)
      .leftJoin(users, eq(incidents.reportedById, users.id))
      .leftJoin(patients, eq(incidents.affectedPatientId, patients.id))
      .where(eq(incidents.id, incidentId))

    if (!result) {
      return null
    }

    // アクション履歴を取得
    const actions = await db
      .select({
        action: incidentActions,
        performedBy: users,
      })
      .from(incidentActions)
      .leftJoin(users, eq(incidentActions.performedById, users.id))
      .where(eq(incidentActions.incidentId, incidentId))
      .orderBy(desc(incidentActions.performedAt))

    return {
      ...result,
      actions,
    }
  } catch (error) {
    console.error("❌ [INCIDENT] 詳細取得エラー:", error)
    throw error
  }
}

/**
 * インシデントのステータスを更新
 */
export async function updateIncidentStatus(
  incidentId: string,
  status: string,
  performedById: string
) {
  try {
    const [updated] = await db
      .update(incidents)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === "RESOLVED" && { resolvedAt: new Date() }),
        ...(status === "CLOSED" && { closedAt: new Date() }),
      })
      .where(eq(incidents.id, incidentId))
      .returning()

    // ステータス変更をアクションとして記録
    await createIncidentAction({
      incidentId,
      actionType: "COMMENT",
      title: "ステータス更新",
      description: `インシデントステータスを「${status}」に変更しました。`,
      performedById,
      performedAt: new Date(),
    })

    console.log(`✅ [INCIDENT] ステータス更新: ${incidentId} -> ${status}`)

    return updated
  } catch (error) {
    console.error("❌ [INCIDENT] ステータス更新エラー:", error)
    throw error
  }
}

/**
 * インシデントに担当者を割り当て
 */
export async function assignIncident(
  incidentId: string,
  assignedToId: string,
  performedById: string
) {
  try {
    const [updated] = await db
      .update(incidents)
      .set({
        assignedToId,
        status: "IN_PROGRESS", // 担当者割り当て時に対応中にする
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, incidentId))
      .returning()

    // 担当者割り当てをアクションとして記録
    const assignedUser = await db.select().from(users).where(eq(users.id, assignedToId))

    await createIncidentAction({
      incidentId,
      actionType: "COMMENT",
      title: "担当者割り当て",
      description: `担当者を「${assignedUser[0]?.name || "不明"}」に割り当てました。`,
      performedById,
      performedAt: new Date(),
    })

    console.log(`✅ [INCIDENT] 担当者割り当て: ${incidentId} -> ${assignedToId}`)

    return updated
  } catch (error) {
    console.error("❌ [INCIDENT] 担当者割り当てエラー:", error)
    throw error
  }
}

/**
 * インシデントの対応策を更新
 */
export async function updateIncidentActions(
  incidentId: string,
  actions: {
    immediateActions?: string[]
    correctiveActions?: string[]
    preventiveMeasures?: string[]
  }
) {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (actions.immediateActions) {
      updateData.immediateActions = JSON.stringify(actions.immediateActions)
    }

    if (actions.correctiveActions) {
      updateData.correctiveActions = JSON.stringify(actions.correctiveActions)
    }

    if (actions.preventiveMeasures) {
      updateData.preventiveMeasures = JSON.stringify(actions.preventiveMeasures)
    }

    const [updated] = await db
      .update(incidents)
      .set(updateData)
      .where(eq(incidents.id, incidentId))
      .returning()

    console.log(`✅ [INCIDENT] 対応策更新: ${incidentId}`)

    return updated
  } catch (error) {
    console.error("❌ [INCIDENT] 対応策更新エラー:", error)
    throw error
  }
}

/**
 * インシデント統計を取得
 */
export async function getIncidentStats(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const incidentList = await db
      .select()
      .from(incidents)
      .where(
        and(
          eq(incidents.organizationId, organizationId),
          gte(incidents.occurredAt, startDate),
          lte(incidents.occurredAt, endDate)
        )
      )

    // タイプ別集計
    const byType: Record<string, number> = {}
    incidentList.forEach((incident) => {
      byType[incident.incidentType] = (byType[incident.incidentType] || 0) + 1
    })

    // 深刻度別集計
    const bySeverity: Record<string, number> = {}
    incidentList.forEach((incident) => {
      bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1
    })

    // ステータス別集計
    const byStatus: Record<string, number> = {}
    incidentList.forEach((incident) => {
      byStatus[incident.status] = (byStatus[incident.status] || 0) + 1
    })

    // 平均解決時間（時間単位）
    const resolvedIncidents = incidentList.filter((i) => i.resolvedAt)
    const averageResolutionTime =
      resolvedIncidents.length > 0
        ? resolvedIncidents.reduce(
            (sum, i) =>
              sum +
              (i.resolvedAt!.getTime() - i.occurredAt.getTime()) / (1000 * 60 * 60),
            0
          ) / resolvedIncidents.length
        : 0

    return {
      total: incidentList.length,
      byType,
      bySeverity,
      byStatus,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
      resolvedCount: resolvedIncidents.length,
      resolvedRate:
        incidentList.length > 0
          ? Math.round((resolvedIncidents.length / incidentList.length) * 100)
          : 0,
    }
  } catch (error) {
    console.error("❌ [INCIDENT] 統計取得エラー:", error)
    throw error
  }
}

/**
 * インシデント検索（キーワード検索）
 */
export async function searchIncidents(
  organizationId: string,
  keyword: string,
  options?: {
    limit?: number
    offset?: number
  }
) {
  try {
    const incidentList = await db
      .select({
        incident: incidents,
        reportedBy: users,
      })
      .from(incidents)
      .leftJoin(users, eq(incidents.reportedById, users.id))
      .where(
        and(
          eq(incidents.organizationId, organizationId),
          or(
            like(incidents.title, `%${keyword}%`),
            like(incidents.description, `%${keyword}%`),
            like(incidents.incidentNumber, `%${keyword}%`)
          )
        )
      )
      .orderBy(desc(incidents.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0)

    return incidentList
  } catch (error) {
    console.error("❌ [INCIDENT] 検索エラー:", error)
    throw error
  }
}
