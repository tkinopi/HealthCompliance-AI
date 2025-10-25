"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileCheck,
  Search,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react"

// サンプルデータ
const sampleConsents = [
  {
    id: "1",
    patientNumber: "P-001",
    patientName: "山田 太郎",
    consentType: "個人情報利用同意書",
    obtainedDate: "2024-01-15",
    expiryDate: "2025-01-15",
    status: "VALID",
    daysUntilExpiry: 96,
  },
  {
    id: "2",
    patientNumber: "P-002",
    patientName: "佐藤 花子",
    consentType: "診療情報提供同意書",
    obtainedDate: "2023-12-01",
    expiryDate: "2024-12-01",
    status: "EXPIRED",
    daysUntilExpiry: -314,
  },
  {
    id: "3",
    patientNumber: "P-003",
    patientName: "鈴木 一郎",
    consentType: "検査・治療同意書",
    obtainedDate: "2024-09-25",
    expiryDate: "2024-10-25",
    status: "EXPIRING_SOON",
    daysUntilExpiry: 14,
  },
  {
    id: "4",
    patientNumber: "P-004",
    patientName: "田中 美咲",
    consentType: "個人情報利用同意書",
    obtainedDate: "2024-05-10",
    expiryDate: "2025-05-10",
    status: "VALID",
    daysUntilExpiry: 212,
  },
]

const consentTypes = [
  "全て",
  "個人情報利用同意書",
  "診療情報提供同意書",
  "検査・治療同意書",
  "手術同意書",
  "麻酔同意書",
]

export default function ConsentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("全て")
  const [isScanning, setIsScanning] = useState(false)

  // フィルター処理
  const filteredConsents = sampleConsents.filter((consent) => {
    const matchesSearch =
      consent.patientName.includes(searchQuery) ||
      consent.patientNumber.includes(searchQuery)

    const matchesStatus =
      statusFilter === "all" || consent.status === statusFilter

    const matchesType =
      typeFilter === "全て" || consent.consentType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // ステータス統計
  const stats = {
    total: sampleConsents.length,
    valid: sampleConsents.filter((c) => c.status === "VALID").length,
    expired: sampleConsents.filter((c) => c.status === "EXPIRED").length,
    expiringSoon: sampleConsents.filter((c) => c.status === "EXPIRING_SOON").length,
  }

  // ステータス表示ヘルパー
  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALID":
        return "text-green-700 bg-green-50 border-green-200"
      case "EXPIRED":
        return "text-red-700 bg-red-50 border-red-200"
      case "EXPIRING_SOON":
        return "text-yellow-700 bg-yellow-50 border-yellow-200"
      default:
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VALID":
        return <CheckCircle2 className="h-4 w-4" />
      case "EXPIRED":
        return <AlertCircle className="h-4 w-4" />
      case "EXPIRING_SOON":
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "VALID":
        return "有効"
      case "EXPIRED":
        return "期限切れ"
      case "EXPIRING_SOON":
        return "期限間近"
      default:
        return "不明"
    }
  }

  // CSV エクスポート
  const handleExportCSV = () => {
    const headers = ["患者番号", "患者名", "同意書種類", "取得日", "有効期限", "ステータス"]
    const rows = filteredConsents.map((c) => [
      c.patientNumber,
      c.patientName,
      c.consentType,
      c.obtainedDate,
      c.expiryDate,
      getStatusText(c.status),
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `同意書一覧_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  // 一括スキャン
  const handleBulkScan = async () => {
    setIsScanning(true)
    // シミュレーション
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsScanning(false)
    alert("スキャン完了: 期限切れ1件、期限間近1件が見つかりました")
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-blue-600" />
            患者同意書管理
          </h1>
          <p className="text-gray-600 mt-2">患者同意書の取得状況と有効期限を管理します</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBulkScan}
            disabled={isScanning}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "スキャン中..." : "一括スキャン"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="h-4 w-4 mr-2" />
            CSVエクスポート
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総患者数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">同意書記録あり</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">有効な同意書</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.valid}</div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats.valid / stats.total) * 100)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">期限間近</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <p className="text-xs text-gray-500 mt-1">30日以内に期限</p>
          </CardContent>
        </Card>

        <Card className="border-red-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">期限切れ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-gray-500 mt-1">早急な対応が必要</p>
          </CardContent>
        </Card>
      </div>

      {/* 検索・フィルター */}
      <Card className="border-blue-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="患者名または患者番号で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="VALID">有効</SelectItem>
                <SelectItem value="EXPIRING_SOON">期限間近</SelectItem>
                <SelectItem value="EXPIRED">期限切れ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="同意書種類" />
              </SelectTrigger>
              <SelectContent>
                {consentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 同意書一覧テーブル */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle>同意書一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    患者番号
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    患者名
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    同意書種類
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    取得日
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    有効期限
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredConsents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      該当する同意書が見つかりません
                    </td>
                  </tr>
                ) : (
                  filteredConsents.map((consent) => (
                    <tr
                      key={consent.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {consent.patientNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {consent.patientName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {consent.consentType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {consent.obtainedDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {consent.expiryDate}
                        <div className="text-xs text-gray-500">
                          {consent.daysUntilExpiry > 0
                            ? `残り${consent.daysUntilExpiry}日`
                            : `${Math.abs(consent.daysUntilExpiry)}日経過`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(
                            consent.status
                          )}`}
                        >
                          {getStatusIcon(consent.status)}
                          {getStatusText(consent.status)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* テンプレートダウンロード */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">同意書テンプレート</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {consentTypes.slice(1).map((type) => (
              <Button
                key={type}
                variant="outline"
                className="justify-start text-left h-auto py-3"
                onClick={() => alert(`${type}をダウンロードします`)}
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{type}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
