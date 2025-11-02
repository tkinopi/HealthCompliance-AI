import { db } from "./db"
import { incidents } from "@/db/schema"
import { eq, and, ne, gte } from "drizzle-orm"
import { createChatCompletion } from "./openai-utils"

/**
 * インシデントAI支援機能
 * - 類似インシデント検索
 * - 対応策の自動提案
 * - 報告書下書き生成
 */

export interface IncidentAnalysisResult {
  similarIncidents: Array<{
    id: string
    incidentNumber: string
    title: string
    incidentType: string
    similarity: number
    resolution: string
  }>
  suggestedActions: {
    immediate: string[]
    corrective: string[]
    preventive: string[]
  }
  riskAssessment: {
    recurrenceRisk: "LOW" | "MEDIUM" | "HIGH"
    impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    recommendations: string[]
  }
}

/**
 * 類似インシデントを検索（簡易版 - キーワードベース）
 */
export async function findSimilarIncidents(
  incident: {
    incidentType: string
    title: string
    description: string
    organizationId: string
  },
  limit: number = 5
) {
  try {
    // 過去6ヶ月のインシデントを取得
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const pastIncidents = await db
      .select()
      .from(incidents)
      .where(
        and(
          eq(incidents.organizationId, incident.organizationId),
          eq(incidents.incidentType, incident.incidentType), // 同じタイプのみ
          gte(incidents.occurredAt, sixMonthsAgo)
        )
      )
      .limit(100) // 最大100件を検索対象

    // キーワードマッチングで類似度を計算
    const keywordsToMatch = extractKeywords(incident.title + " " + incident.description)

    const similarIncidents = pastIncidents
      .map((pastIncident) => {
        const pastKeywords = extractKeywords(
          pastIncident.title + " " + pastIncident.description
        )
        const similarity = calculateSimilarity(keywordsToMatch, pastKeywords)

        return {
          id: pastIncident.id,
          incidentNumber: pastIncident.incidentNumber,
          title: pastIncident.title,
          incidentType: pastIncident.incidentType,
          similarity,
          resolution: pastIncident.rootCause || "解決策未記録",
          preventiveMeasures: pastIncident.preventiveMeasures
            ? JSON.parse(pastIncident.preventiveMeasures)
            : [],
        }
      })
      .filter((item) => item.similarity > 0.2) // 類似度20%以上
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    console.log(`🔍 [INCIDENT AI] 類似インシデント検索: ${similarIncidents.length}件`)

    return similarIncidents
  } catch (error) {
    console.error("❌ [INCIDENT AI] 類似インシデント検索エラー:", error)
    return []
  }
}

/**
 * キーワードを抽出（簡易版）
 */
function extractKeywords(text: string): string[] {
  // 日本語対応の簡易版（実際にはMeCabなどの形態素解析が望ましい）
  const keywords = text
    .toLowerCase()
    .split(/[\s、。！？\n]+/)
    .filter((word) => word.length > 1)

  return [...new Set(keywords)]
}

/**
 * 類似度を計算（Jaccard係数）
 */
function calculateSimilarity(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1)
  const set2 = new Set(keywords2)

  const intersection = new Set([...set1].filter((x) => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

/**
 * AI による対応策の提案生成
 */
export async function generateActionPlan(
  incident: {
    incidentType: string
    title: string
    description: string
    severity: string
  },
  similarIncidents: Array<{
    title: string
    resolution: string
    preventiveMeasures: string[]
  }>
): Promise<{
  immediate: string[]
  corrective: string[]
  preventive: string[]
}> {
  try {
    console.log(`🤖 [INCIDENT AI] 対応策生成開始`)

    const similarCasesContext =
      similarIncidents.length > 0
        ? `\n\n過去の類似インシデント:\n${similarIncidents
            .map(
              (sim, i) =>
                `${i + 1}. ${sim.title}\n   解決策: ${sim.resolution}\n   再発防止策: ${sim.preventiveMeasures.join(", ")}`
            )
            .join("\n")}`
        : ""

    const prompt = `あなたは医療機関のインシデント管理の専門家です。以下のインシデントに対する対応計画を提案してください。

インシデント情報:
- タイプ: ${getIncidentTypeLabel(incident.incidentType)}
- 深刻度: ${getSeverityLabel(incident.severity)}
- タイトル: ${incident.title}
- 詳細: ${incident.description}${similarCasesContext}

以下の3つのカテゴリで対応策を提案してください（各カテゴリ3-5項目）:

1. 初動対応（immediate）: インシデント発生直後に取るべき緊急対応
2. 是正措置（corrective）: 問題を修正するための具体的な対策
3. 再発防止策（preventive）: 同様のインシデントを防ぐための長期的な対策

JSON形式で出力してください:
{
  "immediate": ["対応1", "対応2", ...],
  "corrective": ["対策1", "対策2", ...],
  "preventive": ["防止策1", "防止策2", ...]
}`

    const response = await createChatCompletion(
      [
        {
          role: "system",
          content:
            "あなたは日本の医療機関のインシデント管理に精通した専門家です。医療法規制やJCI基準に基づいた適切な対応策を提案します。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        model: "gpt-4o-mini",
        temperature: 0.5,
        maxTokens: 1500,
      }
    )

    // JSONをパース
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const actionPlan = JSON.parse(jsonMatch[0])
      console.log(`✅ [INCIDENT AI] 対応策生成完了`)
      return actionPlan
    }

    // パースに失敗した場合はデフォルト値を返す
    console.warn("⚠️ [INCIDENT AI] 対応策のパースに失敗、デフォルト値を使用")
    return {
      immediate: ["関係者への報告", "現場の安全確保", "証拠の保全"],
      corrective: ["根本原因の特定", "手順の見直し", "スタッフへの周知"],
      preventive: ["定期的な研修の実施", "チェックリストの導入", "監査体制の強化"],
    }
  } catch (error) {
    console.error("❌ [INCIDENT AI] 対応策生成エラー:", error)
    // エラー時はデフォルト値を返す
    return {
      immediate: ["関係者への報告", "現場の安全確保"],
      corrective: ["根本原因の特定", "手順の見直し"],
      preventive: ["定期的な研修の実施", "チェックリストの導入"],
    }
  }
}

/**
 * インシデント報告書の下書きを生成
 */
export async function generateIncidentReport(
  incident: {
    incidentNumber: string
    incidentType: string
    title: string
    description: string
    severity: string
    occurredAt: Date
    discoveredAt: Date
    location?: string
    affectedPatient?: {
      patientNumber: string
      lastName: string
      firstName: string
    }
    reportedBy: {
      name: string
      role: string
    }
  },
  suggestedActions: {
    immediate: string[]
    corrective: string[]
    preventive: string[]
  }
): Promise<string> {
  try {
    console.log(`📝 [INCIDENT AI] 報告書生成開始: ${incident.incidentNumber}`)

    const prompt = `以下の情報を基に、医療機関のインシデント報告書を作成してください。

インシデント番号: ${incident.incidentNumber}
発生日時: ${incident.occurredAt.toLocaleString("ja-JP")}
発見日時: ${incident.discoveredAt.toLocaleString("ja-JP")}
発生場所: ${incident.location || "不明"}
インシデントタイプ: ${getIncidentTypeLabel(incident.incidentType)}
深刻度: ${getSeverityLabel(incident.severity)}
タイトル: ${incident.title}
詳細: ${incident.description}
報告者: ${incident.reportedBy.name}（${incident.reportedBy.role}）
${incident.affectedPatient ? `影響を受けた患者: ${incident.affectedPatient.patientNumber} ${incident.affectedPatient.lastName} ${incident.affectedPatient.firstName}様` : ""}

提案された対応策:
初動対応: ${suggestedActions.immediate.join(", ")}
是正措置: ${suggestedActions.corrective.join(", ")}
再発防止策: ${suggestedActions.preventive.join(", ")}

以下の構成で報告書を作成してください:
1. インシデントの概要
2. 発生状況の詳細
3. 初動対応
4. 原因分析
5. 是正措置
6. 再発防止策
7. まとめ

フォーマルな文体で、医療法規制と個人情報保護に配慮した内容としてください。`

    const reportDraft = await createChatCompletion(
      [
        {
          role: "system",
          content:
            "あなたは医療機関の品質管理部門の専門家です。正確で詳細なインシデント報告書を作成します。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        model: "gpt-4o-mini",
        temperature: 0.3, // 正確性重視
        maxTokens: 2500,
      }
    )

    console.log(`✅ [INCIDENT AI] 報告書生成完了`)

    return reportDraft
  } catch (error) {
    console.error("❌ [INCIDENT AI] 報告書生成エラー:", error)
    throw error
  }
}

/**
 * インシデント完全分析（類似検索 + 対応策提案）
 */
export async function analyzeIncident(
  incident: {
    id?: string
    incidentType: string
    title: string
    description: string
    severity: string
    organizationId: string
  }
): Promise<IncidentAnalysisResult> {
  try {
    console.log(`🔍 [INCIDENT AI] インシデント分析開始`)

    // 1. 類似インシデントを検索
    const similarIncidents = await findSimilarIncidents(incident)

    // 2. 対応策を生成
    const suggestedActions = await generateActionPlan(incident, similarIncidents)

    // 3. リスク評価（簡易版）
    const riskAssessment = assessRisk(incident, similarIncidents)

    // 4. インシデントにAI提案を保存（IDがある場合）
    if (incident.id) {
      await db
        .update(incidents)
        .set({
          similarIncidents: JSON.stringify(similarIncidents.map((s) => s.id)),
          aiSuggestions: JSON.stringify(suggestedActions),
        })
        .where(eq(incidents.id, incident.id))
    }

    console.log(`✅ [INCIDENT AI] インシデント分析完了`)

    return {
      similarIncidents: similarIncidents.map((s) => ({
        id: s.id,
        incidentNumber: s.incidentNumber,
        title: s.title,
        incidentType: s.incidentType,
        similarity: s.similarity,
        resolution: s.resolution,
      })),
      suggestedActions,
      riskAssessment,
    }
  } catch (error) {
    console.error("❌ [INCIDENT AI] インシデント分析エラー:", error)
    throw error
  }
}

/**
 * リスク評価
 */
function assessRisk(
  incident: { incidentType: string; severity: string },
  similarIncidents: any[]
): {
  recurrenceRisk: "LOW" | "MEDIUM" | "HIGH"
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  recommendations: string[]
} {
  // 類似インシデントの数に基づく再発リスク
  let recurrenceRisk: "LOW" | "MEDIUM" | "HIGH" = "LOW"
  if (similarIncidents.length >= 5) {
    recurrenceRisk = "HIGH"
  } else if (similarIncidents.length >= 2) {
    recurrenceRisk = "MEDIUM"
  }

  // 深刻度に基づく影響レベル
  const impactLevel = incident.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

  // 推奨事項
  const recommendations: string[] = []
  if (recurrenceRisk === "HIGH") {
    recommendations.push("類似インシデントが多数発生しています。システム的な対策を検討してください。")
  }
  if (impactLevel === "CRITICAL" || impactLevel === "HIGH") {
    recommendations.push("重大なインシデントです。外部報告の要否を確認してください。")
  }
  if (incident.incidentType === "INFORMATION_LEAK") {
    recommendations.push("個人情報保護委員会への報告が必要な可能性があります。")
  }

  return {
    recurrenceRisk,
    impactLevel,
    recommendations,
  }
}

/**
 * インシデントタイプのラベルを取得
 */
function getIncidentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INFORMATION_LEAK: "情報漏洩",
    SYSTEM_FAILURE: "システム障害",
    CONSENT_DEFICIENCY: "同意書不備",
    MEDICAL_ERROR: "医療過誤",
    INFECTION: "感染症",
    EQUIPMENT_FAILURE: "機器故障",
    OTHER: "その他",
  }
  return labels[type] || type
}

/**
 * 深刻度のラベルを取得
 */
function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    LOW: "低",
    MEDIUM: "中",
    HIGH: "高",
    CRITICAL: "緊急",
  }
  return labels[severity] || severity
}
