"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Settings, User, Lock, Bell, Building2, CheckCircle2, XCircle } from "lucide-react"
import { TwoFactorSetup } from "@/components/auth/two-factor-setup"

export default function SettingsPage() {
  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  useEffect(() => {
    // ユーザーの2FA状態を取得
    const fetch2FAStatus = async () => {
      try {
        const response = await fetch("/api/auth/2fa/status")
        if (response.ok) {
          const data = await response.json()
          setTwoFactorEnabled(data.enabled)
        }
      } catch (error) {
        console.error("2FA状態の取得に失敗しました", error)
      } finally {
        setIsLoadingStatus(false)
      }
    }

    fetch2FAStatus()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    // 保存処理をシミュレート
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const handleDisable2FA = async () => {
    const password = prompt("2段階認証を無効にするには、パスワードを入力してください：")

    if (!password) {
      return
    }

    if (!confirm("2段階認証を無効にしますか？セキュリティが低下する可能性があります。")) {
      return
    }

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        setTwoFactorEnabled(false)
        alert("2段階認証を無効にしました")
      } else {
        alert(data.error || "2段階認証の無効化に失敗しました")
      }
    } catch (error) {
      console.error("2FA無効化エラー:", error)
      alert("エラーが発生しました")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8 text-blue-600" />
          設定
        </h1>
        <p className="text-gray-600 mt-2">
          アカウントとシステムの設定を管理します
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">プロフィール</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">医療機関</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">セキュリティ</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">通知</span>
          </TabsTrigger>
        </TabsList>

        {/* プロフィール設定 */}
        <TabsContent value="profile">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle>プロフィール設定</CardTitle>
              <CardDescription>
                個人情報とアカウント設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">氏名</Label>
                    <Input
                      id="name"
                      placeholder="山田 太郎"
                      defaultValue=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@clinic.jp"
                      defaultValue=""
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">所属部署</Label>
                    <Input
                      id="department"
                      placeholder="内科"
                      defaultValue=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">役職</Label>
                    <Input
                      id="position"
                      placeholder="医師"
                      defaultValue=""
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license">医療従事者資格番号</Label>
                    <Input
                      id="license"
                      placeholder="123456"
                      defaultValue=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="03-1234-5678"
                      defaultValue=""
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? "保存中..." : "変更を保存"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 医療機関設定 */}
        <TabsContent value="organization">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle>医療機関情報</CardTitle>
              <CardDescription>
                医療機関の基本情報を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">医療機関名</Label>
                  <Input
                    id="org-name"
                    placeholder="〇〇クリニック"
                    defaultValue=""
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-type">医療機関種別</Label>
                    <Input
                      id="org-type"
                      placeholder="診療所"
                      defaultValue=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-license">医療機関番号</Label>
                    <Input
                      id="org-license"
                      placeholder="1234567890"
                      defaultValue=""
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-address">住所</Label>
                  <Input
                    id="org-address"
                    placeholder="東京都千代田区..."
                    defaultValue=""
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-phone">電話番号</Label>
                    <Input
                      id="org-phone"
                      type="tel"
                      placeholder="03-1234-5678"
                      defaultValue=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-director">管理者名</Label>
                    <Input
                      id="org-director"
                      placeholder="山田 太郎"
                      defaultValue=""
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? "保存中..." : "変更を保存"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* セキュリティ設定 */}
        <TabsContent value="security">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle>セキュリティ設定</CardTitle>
              <CardDescription>
                パスワードと2段階認証を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">現在のパスワード</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">新しいパスワード</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    新しいパスワード（確認）
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? "保存中..." : "パスワードを変更"}
                  </Button>
                </div>
              </form>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      2段階認証
                      {isLoadingStatus ? (
                        <span className="text-xs text-gray-500">(読み込み中...)</span>
                      ) : twoFactorEnabled ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {twoFactorEnabled
                        ? "2段階認証が有効になっています"
                        : "セキュリティを強化するため、2段階認証の有効化を推奨します"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {twoFactorEnabled ? (
                      <Button
                        variant="outline"
                        onClick={handleDisable2FA}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        無効にする
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setShow2FADialog(true)}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        2段階認証を設定
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知設定 */}
        <TabsContent value="notifications">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>
                システムからの通知を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      コンプライアンス期限通知
                    </h3>
                    <p className="text-sm text-gray-600">
                      期限が近づいた項目を通知
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600"
                    defaultChecked
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      新規タスク割当通知
                    </h3>
                    <p className="text-sm text-gray-600">
                      新しいタスクが割り当てられた時に通知
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600"
                    defaultChecked
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      レポート完成通知
                    </h3>
                    <p className="text-sm text-gray-600">
                      月次レポートが完成した時に通知
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600"
                    defaultChecked
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      システムメンテナンス通知
                    </h3>
                    <p className="text-sm text-gray-600">
                      メンテナンス情報を通知
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600"
                    defaultChecked
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? "保存中..." : "変更を保存"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2段階認証設定ダイアログ */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <TwoFactorSetup
            onSuccess={() => {
              setTwoFactorEnabled(true)
              setShow2FADialog(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
