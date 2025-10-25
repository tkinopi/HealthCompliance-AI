"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface TwoFactorSetupProps {
  onSuccess?: () => void
}

export function TwoFactorSetup({ onSuccess }: TwoFactorSetupProps = {}) {
  const [step, setStep] = useState<"initial" | "setup" | "verify">("initial")
  const [qrCode, setQrCode] = useState("")
  const [secret, setSecret] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleStartSetup = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("2FAの設定に失敗しました")
      }

      const data = await response.json()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setStep("setup")
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret,
          token: verificationCode,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "認証に失敗しました")
      }

      setSuccess(true)
      setStep("verify")
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>2段階認証の設定</CardTitle>
        <CardDescription>
          アカウントのセキュリティを強化するために2段階認証を設定してください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "initial" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                2段階認証について
              </h3>
              <p className="text-sm text-blue-800">
                2段階認証を有効にすると、ログイン時にパスワードに加えて、
                認証アプリで生成される6桁のコードが必要になります。
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">必要なもの:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>スマートフォン</li>
                <li>
                  認証アプリ（Google Authenticator、Microsoft Authenticator など）
                </li>
              </ul>
            </div>

            <Button onClick={handleStartSetup} disabled={isLoading} className="w-full">
              {isLoading ? "準備中..." : "2段階認証を設定する"}
            </Button>
          </div>
        )}

        {step === "setup" && !success && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  ステップ 1: QRコードをスキャン
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  認証アプリでこのQRコードをスキャンしてください
                </p>
                {qrCode && (
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <Image
                      src={qrCode}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-600 mb-2">
                  QRコードをスキャンできない場合は、このコードを手動で入力してください:
                </p>
                <code className="block p-2 bg-white rounded border text-sm font-mono break-all">
                  {secret}
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  ステップ 2: 認証コードを入力
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  認証アプリに表示されている6桁のコードを入力してください
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">認証コード</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <Button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full"
              >
                {isLoading ? "検証中..." : "認証を完了する"}
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                2段階認証が有効になりました
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                次回ログイン時から2段階認証が必要になります
              </p>
            </div>
            <Button
              onClick={() => {
                if (onSuccess) {
                  onSuccess()
                } else {
                  window.location.reload()
                }
              }}
              className="mt-4"
            >
              完了
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
