"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
  X,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Notification {
  id: string
  type: "URGENT" | "WARNING" | "INFO"
  category: string
  title: string
  message: string
  priority: string
  isRead: boolean
  isHandled: boolean
  relatedId?: string
  relatedType?: string
  actionUrl?: string
  createdAt: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "URGENT" | "WARNING" | "INFO">(
    "ALL"
  )
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [filter, showUnreadOnly])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (showUnreadOnly) params.append("onlyUnread", "true")
      if (filter !== "ALL") params.append("type", filter)
      params.append("limit", "100")

      const response = await fetch(`/api/notifications?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("通知取得エラー:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/mark-read`,
        {
          method: "POST",
        }
      )
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error("既読マークエラー:", error)
    }
  }

  const handleMarkAsHandled = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/mark-handled`,
        {
          method: "POST",
        }
      )
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error("対応済みマークエラー:", error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!confirm("この通知を削除してもよろしいですか？")) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error("削除エラー:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // 未読の場合は既読にする
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }

    // アクションURLがあれば遷移
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "URGENT":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "WARNING":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "INFO":
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return "bg-gray-50 opacity-75"

    switch (type) {
      case "URGENT":
        return "bg-red-50 border-l-4 border-red-500"
      case "WARNING":
        return "bg-yellow-50 border-l-4 border-yellow-500"
      case "INFO":
        return "bg-blue-50 border-l-4 border-blue-500"
      default:
        return "bg-white"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "CONSENT_EXPIRY":
        return "同意書期限"
      case "TASK_DUE":
        return "届出期限"
      case "LICENSE_EXPIRY":
        return "資格証期限"
      case "SECURITY_ALERT":
        return "セキュリティ"
      default:
        return category
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">通知センター</h1>
          <p className="text-sm text-gray-500 mt-1">
            未読通知: {unreadCount}件
          </p>
        </div>
      </div>

      {/* フィルター */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              フィルター:
            </span>
          </div>

          <Select
            value={filter}
            onValueChange={(value: any) => setFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="種類で絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">すべて</SelectItem>
              <SelectItem value="URGENT">緊急</SelectItem>
              <SelectItem value="WARNING">警告</SelectItem>
              <SelectItem value="INFO">情報</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">未読のみ表示</span>
          </label>

          {(filter !== "ALL" || showUnreadOnly) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilter("ALL")
                setShowUnreadOnly(false)
              }}
            >
              <X className="h-4 w-4 mr-1" />
              フィルタークリア
            </Button>
          )}
        </div>
      </Card>

      {/* 通知リスト */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">通知はありません</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${getBgColor(
                notification.type,
                notification.isRead
              )}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-4">
                {/* アイコン */}
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`font-semibold ${
                          notification.isRead
                            ? "text-gray-600"
                            : "text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                        {getCategoryLabel(notification.category)}
                      </span>
                      {notification.isHandled && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          対応済み
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    className={`text-sm ${
                      notification.isRead ? "text-gray-500" : "text-gray-700"
                    } mb-2`}
                  >
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString("ja-JP")}
                    </span>

                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          既読
                        </Button>
                      )}
                      {!notification.isHandled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsHandled(notification.id)}
                        >
                          <CheckCheck className="h-4 w-4 mr-1" />
                          対応済み
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
