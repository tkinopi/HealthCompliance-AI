"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  Users,
  Activity,
  FileText,
} from "lucide-react"

interface ReportSummary {
  period: {
    start: string
    end: string
    days: number
  }
  totalAccess: number
  totalAnomalies: number
  anomalyRate: string
  averageAnomalyScore: number
  uniqueUsersWithAnomalies: number
}

interface SeverityDistribution {
  critical: number
  high: number
  medium: number
  low: number
}

interface AnomalyReport {
  summary: ReportSummary
  severityDistribution: SeverityDistribution
  topAnomalousUsers: Array<{
    userId: string
    userName: string
    userEmail: string
    count: number
    averageScore: number
  }>
  hourlyDistribution: Array<{
    hour: string
    count: number
  }>
  dailyTrend: Array<{
    date: string
    count: number
  }>
  topReasons: Array<{
    reason: string
    count: number
  }>
  resourceTypeDistribution: Array<{
    type: string
    count: number
  }>
  criticalAnomalies: Array<{
    timestamp: string
    userId: string
    userName: string
    resourceType: string
    resourceId: string
    action: string
    anomalyScore: number
    reasons: string[]
    ipAddress: string
  }>
  recommendations: string[]
}

export default function SecurityDashboardPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly")
  const [report, setReport] = useState<AnomalyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchReport()
  }, [period])

  const fetchReport = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/security/anomaly-report?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data.report)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "レポートの取得に失敗しました")
      }
    } catch (error: any) {
      console.error("レポート取得エラー:", error)
      setError("レポートの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = async () => {
    try {
      const response = await fetch(`/api/security/anomaly-report?period=${period}&format=csv`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `anomaly-report-${period}-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("CSV ダウンロードエラー:", error)
      alert("CSV のダウンロードに失敗しました")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">セキュリティ監視</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">レポートを読み込み中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">セキュリティ監視</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-900">エラーが発生しました</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!report) {
    return null
  }

  const getSeverityColor = (severity: "critical" | "high" | "medium" | "low") => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50"
      case "high":
        return "text-orange-600 bg-orange-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-blue-600 bg-blue-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">セキュリティ監視</h1>
          <p className="text-sm text-gray-500 mt-1">
            アクセスログの異常検知と分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">過去24時間</SelectItem>
              <SelectItem value="weekly">過去7日間</SelectItem>
              <SelectItem value="monthly">過去30日間</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchReport}>
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              総アクセス数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-900">
                {report.summary.totalAccess.toLocaleString()}
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              異常検知数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">
                {report.summary.totalAnomalies.toLocaleString()}
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              異常率: {report.summary.anomalyRate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              平均異常スコア
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-600">
                {report.summary.averageAnomalyScore}
              </div>
              <TrendingUp className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">0-100 スケール</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              異常検知ユーザー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">
                {report.summary.uniqueUsersWithAnomalies}
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 重大度分布 */}
      <Card>
        <CardHeader>
          <CardTitle>重大度別分布</CardTitle>
          <CardDescription>異常検知の重要度による分類</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${getSeverityColor("critical")}`}>
              <div className="text-sm font-medium mb-1">緊急 (80+)</div>
              <div className="text-2xl font-bold">{report.severityDistribution.critical}</div>
            </div>
            <div className={`p-4 rounded-lg ${getSeverityColor("high")}`}>
              <div className="text-sm font-medium mb-1">高 (70-79)</div>
              <div className="text-2xl font-bold">{report.severityDistribution.high}</div>
            </div>
            <div className={`p-4 rounded-lg ${getSeverityColor("medium")}`}>
              <div className="text-sm font-medium mb-1">中 (50-69)</div>
              <div className="text-2xl font-bold">{report.severityDistribution.medium}</div>
            </div>
            <div className={`p-4 rounded-lg ${getSeverityColor("low")}`}>
              <div className="text-sm font-medium mb-1">低 (50未満)</div>
              <div className="text-2xl font-bold">{report.severityDistribution.low}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 異常検知が多いユーザー */}
        <Card>
          <CardHeader>
            <CardTitle>異常アクセスが多いユーザー</CardTitle>
            <CardDescription>期間内の異常検知回数上位</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.topAnomalousUsers.length === 0 ? (
                <p className="text-sm text-gray-500">データがありません</p>
              ) : (
                report.topAnomalousUsers.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.userName}</div>
                      <div className="text-xs text-gray-500">{user.userEmail}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">{user.count} 回</div>
                      <div className="text-xs text-gray-500">
                        平均スコア: {user.averageScore.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 検知理由トップ */}
        <Card>
          <CardHeader>
            <CardTitle>検知理由の内訳</CardTitle>
            <CardDescription>異常と判定された理由の上位</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.topReasons.length === 0 ? (
                <p className="text-sm text-gray-500">データがありません</p>
              ) : (
                report.topReasons.map((reason, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 flex-1">{reason.reason}</div>
                    <div className="ml-4 flex items-center gap-2">
                      <div className="text-sm font-bold text-gray-900">{reason.count}</div>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(reason.count / report.topReasons[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 重大な異常 */}
      {report.criticalAnomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              重大な異常アクセス（スコア80以上）
            </CardTitle>
            <CardDescription>
              早急な対応が必要な可能性があります
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.criticalAnomalies.slice(0, 10).map((anomaly, index) => (
                <div
                  key={index}
                  className="p-4 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {anomaly.userName} ({anomaly.userEmail})
                      </div>
                      <div className="text-sm text-gray-600">
                        {anomaly.action} {anomaly.resourceType} / {anomaly.resourceId}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {anomaly.anomalyScore}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(anomaly.timestamp).toLocaleString("ja-JP")}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    IP: {anomaly.ipAddress || "不明"}
                  </div>
                  <div className="space-y-1">
                    {anomaly.reasons.map((reason, idx) => (
                      <div key={idx} className="text-xs text-red-700">
                        • {reason}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 推奨事項 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            セキュリティ推奨事項
          </CardTitle>
          <CardDescription>
            検出された傾向に基づく対策の提案
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
