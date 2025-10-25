import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { verifyTOTP } from "@/lib/totp"
import { db } from "@/lib/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * 2FA検証エンドポイント
 * TOTPコードを検証し、2FAを有効化する
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

    const { secret, token } = await req.json()

    if (!secret || !token) {
      return NextResponse.json(
        { error: "シークレットとトークンが必要です" },
        { status: 400 }
      )
    }

    // TOTPコードを検証
    const isValid = verifyTOTP(secret, token)

    if (!isValid) {
      return NextResponse.json(
        { error: "認証コードが正しくありません" },
        { status: 400 }
      )
    }

    // 2FAを有効化
    await db
      .update(users)
      .set({
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: "2段階認証が有効化されました",
    })
  } catch (error) {
    console.error("2FA検証エラー:", error)
    return NextResponse.json(
      { error: "2FAの検証に失敗しました" },
      { status: 500 }
    )
  }
}
