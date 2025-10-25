import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

/**
 * GET /api/notifications
 * ユーザーの通知一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const onlyUnread = searchParams.get("onlyUnread") === "true"
    const type = searchParams.get("type") // URGENT, WARNING, INFO
    const category = searchParams.get("category") // CONSENT_EXPIRY, TASK_DUE, etc.
    const limit = parseInt(searchParams.get("limit") || "50")

    // 基本条件: ユーザーの通知のみ
    const conditions = [eq(notifications.userId, session.user.id)]

    // 未読のみフィルタ
    if (onlyUnread) {
      conditions.push(eq(notifications.isRead, false))
    }

    // タイプフィルタ
    if (type) {
      conditions.push(eq(notifications.type, type))
    }

    // カテゴリフィルタ
    if (category) {
      conditions.push(eq(notifications.category, category))
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)

    // 未読数を取得
    const unreadCount = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.isRead, false)
        )
      )

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: unreadCount.length,
      total: userNotifications.length,
    })
  } catch (error) {
    console.error("通知取得エラー:", error)
    return NextResponse.json(
      { error: "通知の取得に失敗しました" },
      { status: 500 }
    )
  }
}
