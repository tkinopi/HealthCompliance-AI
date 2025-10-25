import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    // ユーザーの2FA状態を取得
    const [user] = await db
      .select({
        twoFactorEnabled: users.twoFactorEnabled,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
    })
  } catch (error) {
    console.error("2FA status error:", error)
    return NextResponse.json(
      { error: "2FA状態の取得に失敗しました" },
      { status: 500 }
    )
  }
}
