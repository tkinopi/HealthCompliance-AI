"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskCalendar } from "@/components/tasks/task-calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ClipboardList,
  Search,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Eye,
  Sparkles,
  Filter,
} from "lucide-react"

// サンプルデータ：クリニックと介護施設の規制タスク
const sampleTasks = [
  {
    id: "1",
    name: "診療所開設届",
    facilityType: "CLINIC",
    dueDate: "2025-12-31",
    status: "NOT_STARTED",
    assignedTo: "山田 太郎",
    description: "年1回の診療所開設届の提出",
    daysUntilDue: 81,
    regulatoryTaskId: "rt1",
  },
  {
    id: "2",
    name: "医療法人決算届",
    facilityType: "CLINIC",
    dueDate: "2025-06-30",
    status: "IN_PROGRESS",
    assignedTo: "佐藤 花子",
    description: "決算後3ヶ月以内に提出",
    daysUntilDue: 262,
    regulatoryTaskId: "rt2",
  },
  {
    id: "3",
    name: "医療安全管理報告",
    facilityType: "CLINIC",
    dueDate: "2025-03-31",
    status: "UNDER_REVIEW",
    assignedTo: "鈴木 一郎",
    description: "半年ごとの医療安全管理報告",
    daysUntilDue: 171,
    regulatoryTaskId: "rt3",
  },
  {
    id: "4",
    name: "院内感染対策報告",
    facilityType: "CLINIC",
    dueDate: "2025-11-30",
    status: "COMPLETED",
    assignedTo: "田中 美咲",
    description: "年1回の院内感染対策報告",
    daysUntilDue: 50,
    regulatoryTaskId: "rt4",
  },
  {
    id: "5",
    name: "介護保険指定更新",
    facilityType: "CARE_FACILITY",
    dueDate: "2026-05-31",
    status: "NOT_STARTED",
    assignedTo: null,
    description: "6年ごとの指定更新申請",
    daysUntilDue: 600,
    regulatoryTaskId: "rt5",
  },
  {
    id: "6",
    name: "運営推進会議記録",
    facilityType: "CARE_FACILITY",
    dueDate: "2024-12-31",
    status: "IN_PROGRESS",
    assignedTo: "高橋 健太",
    description: "2ヶ月ごとの運営推進会議記録",
    daysUntilDue: 20,
    regulatoryTaskId: "rt6",
  },
  {
    id: "7",
    name: "事故報告書",
    facilityType: "CARE_FACILITY",
    dueDate: "2024-10-15",
    status: "NOT_STARTED",
    assignedTo: "渡辺 さくら",
    description: "事故発生時の報告書",
    daysUntilDue: 4,
    regulatoryTaskId: "rt7",
  },
]

const facilityTypes = [
  { value: "ALL", label: "すべて" },
  { value: "CLINIC", label: "クリニック" },
  { value: "CARE_FACILITY", label: "介護施設" },
  { value: "HOSPITAL", label: "病院" },
  { value: "DENTAL_CLINIC", label: "歯科クリニック" },
]

export default function TasksPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [facilityTypeFilter, setFacilityTypeFilter] = useState("ALL")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

  // フィルター処理
  const filteredTasks = sampleTasks.filter((task) => {
    const matchesSearch = task.name.includes(searchQuery) || task.description.includes(searchQuery)
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter
    const matchesFacilityType = facilityTypeFilter === "ALL" || task.facilityType === facilityTypeFilter
    return matchesSearch && matchesStatus && matchesFacilityType
  })

  // ステータス統計
  const stats = {
    total: sampleTasks.length,
    notStarted: sampleTasks.filter((t) => t.status === "NOT_STARTED").length,
    inProgress: sampleTasks.filter((t) => t.status === "IN_PROGRESS").length,
    dueWithin7Days: sampleTasks.filter((t) => t.daysUntilDue <= 7 && t.status !== "COMPLETED").length,
    completed: sampleTasks.filter((t) => t.status === "COMPLETED").length,
  }

  // ステータス表示ヘルパー
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return <Clock className="h-3 w-3" />
      case "IN_PROGRESS":
        return <Play className="h-3 w-3" />
      case "UNDER_REVIEW":
        return <Eye className="h-3 w-3" />
      case "COMPLETED":
        return <CheckCircle2 className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "未着手"
      case "IN_PROGRESS":
        return "作成中"
      case "UNDER_REVIEW":
        return "確認中"
      case "COMPLETED":
        return "完了"
      default:
        return "不明"
    }
  }

  const getFacilityTypeText = (type: string) => {
    switch (type) {
      case "CLINIC":
        return "クリニック"
      case "CARE_FACILITY":
        return "介護施設"
      case "HOSPITAL":
        return "病院"
      case "DENTAL_CLINIC":
        return "歯科クリニック"
      default:
        return type
    }
  }

  const getDueDateColor = (daysUntilDue: number, status: string) => {
    if (status === "COMPLETED") return "text-green-600"
    if (daysUntilDue < 0) return "text-red-600 font-semibold"
    if (daysUntilDue <= 7) return "text-orange-600 font-semibold"
    if (daysUntilDue <= 30) return "text-yellow-600"
    return "text-gray-700"
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            医療法規制タスク管理
          </h1>
          <p className="text-gray-600 mt-2">届出・報告書類の作成と進捗管理</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-blue-600 text-white" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            リスト
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            className={viewMode === "calendar" ? "bg-blue-600 text-white" : ""}
          >
            <Calendar className="h-4 w-4 mr-2" />
            カレンダー
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総タスク数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">すべてのタスク</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">未着手</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.notStarted}</div>
            <p className="text-xs text-gray-500 mt-1">開始前のタスク</p>
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">期限間近</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.dueWithin7Days}</div>
            <p className="text-xs text-gray-500 mt-1">7日以内に期限</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">完了</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-gray-500 mt-1">完了したタスク</p>
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
                placeholder="タスク名または説明で検索..."
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
                <SelectItem value="ALL">すべて</SelectItem>
                <SelectItem value="NOT_STARTED">未着手</SelectItem>
                <SelectItem value="IN_PROGRESS">作成中</SelectItem>
                <SelectItem value="UNDER_REVIEW">確認中</SelectItem>
                <SelectItem value="COMPLETED">完了</SelectItem>
              </SelectContent>
            </Select>

            <Select value={facilityTypeFilter} onValueChange={setFacilityTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="施設タイプ" />
              </SelectTrigger>
              <SelectContent>
                {facilityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* タスク一覧 */}
      {viewMode === "list" ? (
        <Card className="border-blue-100 shadow-sm">
          <CardHeader>
            <CardTitle>タスク一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      タスク名
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      施設タイプ
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      期限
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      担当者
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
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        該当するタスクが見つかりません
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {getFacilityTypeText(task.facilityType)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className={getDueDateColor(task.daysUntilDue, task.status)}>
                            <div className="text-sm">{task.dueDate}</div>
                            <div className="text-xs">
                              {task.status === "COMPLETED"
                                ? "提出済"
                                : task.daysUntilDue < 0
                                ? `${Math.abs(task.daysUntilDue)}日超過`
                                : `残り${task.daysUntilDue}日`}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {task.assignedTo || (
                            <span className="text-gray-400">未割当</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {getStatusIcon(task.status)}
                            {getStatusText(task.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/tasks/${task.id}`}>
                              <Button variant="ghost" size="sm" className="text-blue-600">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {task.status !== "COMPLETED" && (
                              <Link href={`/dashboard/tasks/${task.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-purple-600"
                                  title="AI書類作成"
                                >
                                  <Sparkles className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Button variant="ghost" size="sm" className="text-gray-600">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-100 shadow-sm">
          <CardHeader>
            <CardTitle>タスクカレンダー</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskCalendar
              tasks={filteredTasks}
              onSelectEvent={(event) => {
                router.push(`/dashboard/tasks/${event.id}`)
              }}
            />
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-600"></div>
                <span>未着手</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-600"></div>
                <span>作成中</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span>期限間近（7日以内）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>期限超過</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-600"></div>
                <span>完了</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
