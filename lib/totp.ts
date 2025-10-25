import speakeasy from "speakeasy"
import QRCode from "qrcode"

/**
 * 新しいTOTPシークレットを生成
 */
export function generateTOTPSecret(userEmail: string, issuer: string = "医療法人さくらクリニック") {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${userEmail})`,
    issuer: issuer,
    length: 32,
  })

  return {
    secret: secret.base32!,
    otpauthUrl: secret.otpauth_url!,
  }
}

/**
 * QRコードを生成（Data URL形式）
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
    return qrCodeDataUrl
  } catch (error) {
    console.error("QRコード生成エラー:", error)
    throw new Error("QRコードの生成に失敗しました")
  }
}

/**
 * TOTPコードを検証
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    // トークンを正規化（スペースやハイフンを削除）
    const normalizedToken = token.replace(/[\s-]/g, "")

    console.log("🔐 [TOTP] 検証開始", {
      tokenLength: normalizedToken.length,
      token: normalizedToken,
    })

    const result = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: normalizedToken,
      window: 6, // 前後6ステップ（約3分）の誤差を許容
    })

    console.log("🔐 [TOTP] 検証結果", { result })

    return result
  } catch (error) {
    console.error("🔐 [TOTP] 検証エラー", error)
    return false
  }
}

/**
 * 現在のTOTPコードを生成（テスト用）
 */
export function generateTOTPToken(secret: string): string {
  return speakeasy.totp({
    secret: secret,
    encoding: "base32",
  })
}
