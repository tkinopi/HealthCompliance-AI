import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications } from "@/db/schema"
import { eq, and } from "drizzle-orm"

/**
 * POST /api/notifications/[id]/mark-read
 * 通知を既読にする
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const notificationId = params.id

    // 通知が存在し、ユーザーのものであることを確認
    const [notification] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id)
        )
      )
      .limit(1)

    if (!notification) {
      return NextResponse.json(
        { error: "通知が見つかりません" },
        { status: 404 }
      )
    }

    // 既読にする
    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId))
      .returning()

    return NextResponse.json({
      success: true,
      notification: updated,
    })
  } catch (error) {
    console.error("既読マークエラー:", error)
    return NextResponse.json(
      { error: "既読マークに失敗しました" },
      { status: 500 }
    )
  }
}
