"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // クライアント側でIPアドレスとUserAgentを取得
      const ipAddress = "client" // サーバー側で取得する方が正確
      const userAgent = navigator.userAgent

      const credentials: Record<string, string> = {
        email,
        password,
        ipAddress,
        userAgent,
      }

      // 2FAコードが入力されている場合のみtotpCodeを追加
      // 空の場合は追加しない（undefinedとして送信されるのを防ぐ）
      if (totpCode && totpCode.trim() !== "") {
        credentials.totpCode = totpCode
      }

      const result = await signIn("credentials", {
        ...credentials,
        redirect: false,
      })

      if (result?.error) {
        // 2FAが必要な場合
        if (result.error.includes("2段階認証コードを入力してください")) {
          setNeedsTwoFactor(true)
          setError("2段階認証コードを入力してください")
        } else {
          setError(result.error)
        }
      } else if (result?.ok) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("ログインに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-blue-600 p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">医療法人さくらクリニック</CardTitle>
          <CardDescription>スタッフログインシステム</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@sakura-clinic.jp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {needsTwoFactor && (
              <div className="space-y-2">
                <Label htmlFor="totpCode">2段階認証コード</Label>
                <Input
                  id="totpCode"
                  type="text"
                  placeholder="6桁のコード"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <p className="text-xs text-gray-500">
                  認証アプリに表示されている6桁のコードを入力してください
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>

            <div className="mt-4 text-center text-xs text-gray-500">
              <p>このシステムは医療情報を扱うため、</p>
              <p>ログイン履歴が記録されます。</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
