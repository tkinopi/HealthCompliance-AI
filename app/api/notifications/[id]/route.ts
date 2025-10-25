import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { notifications } from "@/db/schema"
import { eq, and } from "drizzle-orm"

/**
 * DELETE /api/notifications/[id]
 * 通知を削除
 */
export async function DELETE(
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

    // 削除
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId))

    return NextResponse.json({
      success: true,
      message: "通知を削除しました",
    })
  } catch (error) {
    console.error("通知削除エラー:", error)
    return NextResponse.json(
      { error: "通知の削除に失敗しました" },
      { status: 500 }
    )
  }
}
