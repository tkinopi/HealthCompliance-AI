import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { compare } from "bcryptjs"

/**
 * 2FA無効化エンドポイント
 * パスワードで本人確認後、2FAを無効化する
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { password } = await req.json()

    if (!password) {
      return NextResponse.json(
        { error: "パスワードが必要です" },
        { status: 400 }
      )
    }

    // ユーザー情報を取得
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      )
    }

    // パスワードを検証
    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "パスワードが正しくありません" },
        { status: 400 }
      )
    }

    // 2FAを無効化
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: "2段階認証が無効化されました",
    })
  } catch (error) {
    console.error("2FA無効化エラー:", error)
    return NextResponse.json(
      { error: "2FAの無効化に失敗しました" },
      { status: 500 }
    )
  }
}
