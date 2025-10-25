import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateTOTPSecret, generateQRCode } from "@/lib/totp"

/**
 * 2FA設定開始エンドポイント
 * QRコードとシークレットを生成して返す
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    // TOTPシークレットを生成
    const { secret, otpauthUrl } = generateTOTPSecret(session.user.email)

    // QRコードを生成
    const qrCodeDataUrl = await generateQRCode(otpauthUrl)

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
    })
  } catch (error) {
    console.error("2FA設定エラー:", error)
    return NextResponse.json(
      { error: "2FAの設定に失敗しました" },
      { status: 500 }
    )
  }
}
