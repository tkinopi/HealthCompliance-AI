"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileText, Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IncidentFormDialog } from "@/components/incidents/incident-form-dialog"

interface Incident {
  incident: {
    id: string
    incidentNumber: string
    incidentType: string
    title: string
    severity: string
    status: string
    occurredAt: string
    createdAt: string
  }
  reportedBy: {
    name: string
  }
}

export default function IncidentsPage() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [keyword, setKeyword] = useState("")

  useEffect(() => {
    fetchIncidents()
  }, [statusFilter, severityFilter])

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
      if (severityFilter && severityFilter !== "all") params.append("severity", severityFilter)
      if (keyword) params.append("keyword", keyword)

      const response = await fetch(`/api/incidents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setIncidents(data.incidents)
      }
    } catch (error) {
      console.error("インシデント取得エラー:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchIncidents()
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

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">インシデント管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            医療インシデントの報告・対応・分析
          </p>
        </div>
        <IncidentFormDialog onSuccess={fetchIncidents} />
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="キーワード検索..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="REPORTED">報告済み</SelectItem>
                <SelectItem value="IN_PROGRESS">対応中</SelectItem>
                <SelectItem value="UNDER_REVIEW">確認中</SelectItem>
                <SelectItem value="RESOLVED">解決済み</SelectItem>
                <SelectItem value="CLOSED">完了</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="深刻度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="CRITICAL">緊急</SelectItem>
                <SelectItem value="HIGH">高</SelectItem>
                <SelectItem value="MEDIUM">中</SelectItem>
                <SelectItem value="LOW">低</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setStatusFilter("all")
              setSeverityFilter("all")
              setKeyword("")
            }}>
              <Filter className="h-4 w-4 mr-2" />
              クリア
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* インシデント一覧 */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            読み込み中...
          </CardContent>
        </Card>
      ) : incidents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>インシデントが見つかりませんでした</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map(({ incident, reportedBy }) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        {incident.incidentNumber}
                      </span>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {getSeverityLabel(incident.severity)}
                      </Badge>
                      <Badge className={getStatusColor(incident.status)}>
                        {getStatusLabel(incident.status)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {getIncidentTypeLabel(incident.incidentType)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {incident.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        報告者: {reportedBy?.name || "不明"}
                      </span>
                      <span>
                        発生日時: {new Date(incident.occurredAt).toLocaleString("ja-JP")}
                      </span>
                      <span>
                        報告日時: {new Date(incident.createdAt).toLocaleString("ja-JP")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/incidents/${incident.id}`)}
                  >
                    詳細
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
