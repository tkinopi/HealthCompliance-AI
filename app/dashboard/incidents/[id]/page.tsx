"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  User,
  MapPin,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Plus,
  Download,
} from "lucide-react"

interface IncidentAction {
  id: string
  actionType: string
  title: string
  description: string
  performedAt: string
  performedBy: {
    name: string
  }
  isCompleted: boolean
}

interface IncidentDetail {
  incident: {
    id: string
    incidentNumber: string
    incidentType: string
    title: string
    description: string
    severity: string
    status: string
    occurredAt: string
    discoveredAt: string
    location?: string
    rootCause?: string
    immediateActions?: string
    correctiveActions?: string
    preventiveMeasures?: string
    similarIncidents?: string
    aiSuggestions?: string
    reportDocument?: string
    requiresExternalReport: boolean
    externalReportStatus?: string
    resolvedAt?: string
    closedAt?: string
    createdAt: string
  }
  reportedBy: {
    name: string
    role: string
  }
  assignedTo?: {
    name: string
    role: string
  }
  affectedPatient?: {
    patientNumber: string
    lastName: string
    firstName: string
  }
  actions: IncidentAction[]
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const incidentId = params.id as string

  const [incident, setIncident] = useState<IncidentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [newActionTitle, setNewActionTitle] = useState("")
  const [newActionDescription, setNewActionDescription] = useState("")
  const [newActionType, setNewActionType] = useState("COMMENT")

  useEffect(() => {
    fetchIncident()
  }, [incidentId])

  const fetchIncident = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/incidents/${incidentId}`)
      if (response.ok) {
        const data = await response.json()
        setIncident(data.incident)
      }
    } catch (error) {
      console.error("インシデント取得エラー:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchIncident()
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error)
    }
  }

  const runAIAnalysis = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze" }),
      })

      if (response.ok) {
        fetchIncident()
      }
    } catch (error) {
      console.error("AI分析エラー:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  const generateReport = async () => {
    setGeneratingReport(true)
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateReport" }),
      })

      if (response.ok) {
        const data = await response.json()
        // Download report as text file
        const blob = new Blob([data.report], { type: "text/plain" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${incident?.incident.incidentNumber}_report.txt`
        a.click()
      }
    } catch (error) {
      console.error("報告書生成エラー:", error)
    } finally {
      setGeneratingReport(false)
    }
  }

  const addAction = async () => {
    if (!newActionTitle || !newActionDescription) return

    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAction",
          actionType: newActionType,
          title: newActionTitle,
          description: newActionDescription,
        }),
      })

      if (response.ok) {
        setNewActionTitle("")
        setNewActionDescription("")
        setNewActionType("COMMENT")
        fetchIncident()
      }
    } catch (error) {
      console.error("アクション追加エラー:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-300"
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REPORTED":
        return "bg-purple-100 text-purple-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800"
      case "RESOLVED":
        return "bg-green-100 text-green-800"
      case "CLOSED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getIncidentTypeLabel = (type: string) => {
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

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      CRITICAL: "緊急",
      HIGH: "高",
      MEDIUM: "中",
      LOW: "低",
    }
    return labels[severity] || severity
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      REPORTED: "報告済み",
      IN_PROGRESS: "対応中",
      UNDER_REVIEW: "確認中",
      RESOLVED: "解決済み",
      CLOSED: "完了",
    }
    return labels[status] || status
  }

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INITIAL_RESPONSE: "初動対応",
      INVESTIGATION: "調査",
      CORRECTION: "是正措置",
      PREVENTION: "再発防止",
      COMMENT: "コメント",
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">インシデントが見つかりませんでした</p>
        </div>
      </div>
    )
  }

  const aiSuggestions = incident.incident.aiSuggestions
    ? JSON.parse(incident.incident.aiSuggestions)
    : null
  const similarIncidents = incident.incident.similarIncidents
    ? JSON.parse(incident.incident.similarIncidents)
    : []

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/incidents")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            一覧に戻る
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {incident.incident.incidentNumber}
              </h1>
              <Badge className={getSeverityColor(incident.incident.severity)}>
                {getSeverityLabel(incident.incident.severity)}
              </Badge>
              <Badge className={getStatusColor(incident.incident.status)}>
                {getStatusLabel(incident.incident.status)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {getIncidentTypeLabel(incident.incident.incidentType)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runAIAnalysis} disabled={analyzing}>
            <Sparkles className="h-4 w-4 mr-2" />
            {analyzing ? "分析中..." : "AI分析"}
          </Button>
          <Button variant="outline" onClick={generateReport} disabled={generatingReport}>
            <Download className="h-4 w-4 mr-2" />
            {generatingReport ? "生成中..." : "報告書生成"}
          </Button>
        </div>
      </div>

      {/* インシデント詳細 */}
      <Card>
        <CardHeader>
          <CardTitle>{incident.incident.title}</CardTitle>
          <CardDescription>{incident.incident.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>発生日時: {new Date(incident.incident.occurredAt).toLocaleString("ja-JP")}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>発見日時: {new Date(incident.incident.discoveredAt).toLocaleString("ja-JP")}</span>
            </div>
            {incident.incident.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>発生場所: {incident.incident.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span>報告者: {incident.reportedBy.name} ({incident.reportedBy.role})</span>
            </div>
            {incident.assignedTo && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>担当者: {incident.assignedTo.name} ({incident.assignedTo.role})</span>
              </div>
            )}
            {incident.affectedPatient && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>
                  影響を受けた患者: {incident.affectedPatient.patientNumber}{" "}
                  {incident.affectedPatient.lastName} {incident.affectedPatient.firstName}様
                </span>
              </div>
            )}
          </div>

          {/* ステータス更新 */}
          <div className="pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス更新
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("IN_PROGRESS")}
                disabled={incident.incident.status === "IN_PROGRESS"}
              >
                対応中
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("UNDER_REVIEW")}
                disabled={incident.incident.status === "UNDER_REVIEW"}
              >
                確認中
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("RESOLVED")}
                disabled={incident.incident.status === "RESOLVED"}
              >
                解決済み
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("CLOSED")}
                disabled={incident.incident.status === "CLOSED"}
              >
                完了
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI分析結果 */}
      {aiSuggestions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI分析結果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 初動対応 */}
            {aiSuggestions.immediate && aiSuggestions.immediate.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  初動対応
                </h4>
                <ul className="space-y-1">
                  {aiSuggestions.immediate.map((action: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 是正措置 */}
            {aiSuggestions.corrective && aiSuggestions.corrective.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  是正措置
                </h4>
                <ul className="space-y-1">
                  {aiSuggestions.corrective.map((action: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 再発防止策 */}
            {aiSuggestions.preventive && aiSuggestions.preventive.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-green-600" />
                  再発防止策
                </h4>
                <ul className="space-y-1">
                  {aiSuggestions.preventive.map((action: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* タイムライン */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            対応タイムライン
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 新規アクション追加フォーム */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">新規アクション追加</h4>
            <Select value={newActionType} onValueChange={setNewActionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INITIAL_RESPONSE">初動対応</SelectItem>
                <SelectItem value="INVESTIGATION">調査</SelectItem>
                <SelectItem value="CORRECTION">是正措置</SelectItem>
                <SelectItem value="PREVENTION">再発防止</SelectItem>
                <SelectItem value="COMMENT">コメント</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="タイトル"
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
            />
            <Textarea
              placeholder="詳細説明"
              value={newActionDescription}
              onChange={(e) => setNewActionDescription(e.target.value)}
              rows={3}
            />
            <Button onClick={addAction} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>

          {/* アクション一覧 */}
          <div className="space-y-3">
            {incident.actions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                対応記録がありません
              </p>
            ) : (
              incident.actions.map((action) => (
                <div
                  key={action.id}
                  className="border-l-4 border-blue-500 pl-4 py-2 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getActionTypeLabel(action.actionType)}
                        </Badge>
                        <h5 className="text-sm font-semibold text-gray-900">
                          {action.title}
                        </h5>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{action.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {action.performedBy.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(action.performedAt).toLocaleString("ja-JP")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
