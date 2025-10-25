"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertTriangle,
  FileCheck,
  Calendar,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"

export default function DashboardPage() {
  // サンプルデータ
  const complianceScore = 87 // 0-100%
  const totalPatients = 150
  const totalStaff = 12
  const monthlySubmissions = 3
  const alerts = [
    {
      id: 1,
      message: "期限切れ同意書が1件あります",
      severity: "high",
      date: "2025-10-10",
    },
  ]

  // 4つのステータスカード用データ
  const consentRate = 92 // 患者同意書取得率
  const staffWithValidLicense = 11
  const staffWithInvalidLicense = 1

  // グラフ用データ
  const pieData = [
    { name: "完了", value: 82, color: "#10b981" },
    { name: "対応中", value: 12, color: "#3b82f6" },
    { name: "未対応", value: 6, color: "#f59e0b" },
  ]

  const barData = [
    { month: "7月", 届出: 5, 完了: 5 },
    { month: "8月", 届出: 4, 完了: 3 },
    { month: "9月", 届出: 6, 完了: 6 },
    { month: "10月", 届出: 3, 完了: 1 },
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600 mt-2">
          コンプライアンス状況の概要を確認できます
        </p>
      </div>

      {/* コンプライアンススコア */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">
              総合コンプライアンススコア
            </p>
            <div className="relative inline-flex items-center justify-center">
              <div className="text-7xl font-bold text-blue-600">
                {complianceScore}
                <span className="text-4xl">%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {complianceScore >= 90
                ? "優良な状態です"
                : complianceScore >= 70
                ? "良好な状態です"
                : "改善が必要です"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 重要アラート */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              重要なアラート
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-200"
                >
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-500 mt-1">{alert.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4つのステータスカード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 患者同意書 */}
        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              患者同意書
            </CardTitle>
            <FileCheck className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {consentRate}%
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {totalPatients}名中 {Math.round((totalPatients * consentRate) / 100)}名取得済
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${consentRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 届出期限 */}
        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              今月の届出
            </CardTitle>
            <Calendar className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {monthlySubmissions}
            </div>
            <p className="text-xs text-gray-500 mt-2">件の届出が必要</p>
            <div className="mt-3">
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                期限: 10月31日
              </p>
            </div>
          </CardContent>
        </Card>

        {/* スタッフ資格 */}
        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              スタッフ資格
            </CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-purple-600">
                {staffWithValidLicense}
              </div>
              <span className="text-sm text-gray-500">/ {totalStaff}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">資格有効</p>
            <div className="mt-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-600">
                {staffWithValidLicense}名 有効
              </span>
              {staffWithInvalidLicense > 0 && (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-600">
                    {staffWithInvalidLicense}名 要更新
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* セキュリティ状態 */}
        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              セキュリティ
            </CardTitle>
            <Shield className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">良好</div>
            <p className="text-xs text-gray-500 mt-2">すべてのチェックに合格</p>
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                2段階認証: 有効
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                最終監査: 1週間前
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* グラフセクション */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 円グラフ */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              コンプライアンス項目の状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-4 text-sm">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 棒グラフ */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              月別届出状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="届出" fill="#3b82f6" />
                <Bar dataKey="完了" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-4 text-center">
              直近4ヶ月の届出と完了件数の推移
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 患者・スタッフ統計 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              登録患者数
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {totalPatients}
            </div>
            <p className="text-xs text-gray-500 mt-2">アクティブな患者</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              スタッフ数
            </CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStaff}</div>
            <p className="text-xs text-gray-500 mt-2">アクティブなスタッフ</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
