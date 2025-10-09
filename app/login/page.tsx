"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        totpCode: showTwoFactor ? totpCode : undefined,
      })

      if (result?.error) {
        if (result.error.includes("2段階認証コードを入力")) {
          setShowTwoFactor(true)
          setError(result.error)
        } else {
          setError(result.error)
        }
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("ログインに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            HealthCompliance AI
          </h1>
          <p className="text-gray-600">医療機関向けコンプライアンス管理システム</p>
        </div>

        <Card className="shadow-lg border-blue-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">ログイン</CardTitle>
            <CardDescription className="text-center">
              メールアドレスとパスワードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@clinic.jp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-gray-300"
                />
              </div>

              {showTwoFactor && (
                <div className="space-y-2">
                  <Label htmlFor="totpCode">2段階認証コード</Label>
                  <Input
                    id="totpCode"
                    type="text"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    maxLength={6}
                    disabled={isLoading}
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-500">
                    認証アプリに表示される6桁のコードを入力してください
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                パスワードをお忘れですか？
                <button className="text-blue-600 hover:underline ml-1">
                  リセット
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2024 HealthCompliance AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
