"use client"

import { useEffect, useState } from "react"
import { X, AlertTriangle, AlertCircle, Info, Bell } from "lucide-react"
import { useRouter } from "next/navigation"

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
  createdAt: Date
}

export function AlertBanner() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    // 1分ごとに更新
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?onlyUnread=true&limit=5")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("通知取得エラー:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (notificationId: string) => {
    // 既読にする
    try {
      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: "POST",
      })
      setDismissedIds((prev) => new Set([...prev, notificationId]))
    } catch (error) {
      console.error("既読マークエラー:", error)
    }
  }

  const handleClick = async (notification: Notification) => {
    // 既読にする
    await handleDismiss(notification.id)

    // アクションURLがあれば遷移
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  // 未読かつ非表示にしていない緊急通知のみ表示
  const visibleNotifications = notifications.filter(
    (n) => !dismissedIds.has(n.id) && (n.type === "URGENT" || n.type === "WARNING")
  )

  if (loading || visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {visibleNotifications.map((notification) => {
        const isUrgent = notification.type === "URGENT"
        const isWarning = notification.type === "WARNING"

        const bgColor = isUrgent
          ? "bg-red-50 border-red-200"
          : isWarning
          ? "bg-yellow-50 border-yellow-200"
          : "bg-blue-50 border-blue-200"

        const textColor = isUrgent
          ? "text-red-800"
          : isWarning
          ? "text-yellow-800"
          : "text-blue-800"

        const iconColor = isUrgent
          ? "text-red-600"
          : isWarning
          ? "text-yellow-600"
          : "text-blue-600"

        const Icon = isUrgent
          ? AlertTriangle
          : isWarning
          ? AlertCircle
          : Info

        return (
          <div
            key={notification.id}
            className={`flex items-start justify-between gap-3 rounded-lg border p-4 ${bgColor} ${textColor} cursor-pointer transition-all hover:shadow-md`}
            onClick={() => handleClick(notification)}
          >
            <div className="flex items-start gap-3 flex-1">
              <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                {notification.actionUrl && (
                  <p className="text-xs mt-2 opacity-70">
                    クリックして詳細を確認 →
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDismiss(notification.id)
              }}
              className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
              aria-label="閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
