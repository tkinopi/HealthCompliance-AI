"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Sparkles, AlertTriangle, CheckCircle2, XCircle, Copy, Download } from "lucide-react"

interface DocumentType {
  type: string
  name: string
  requiredFields: string[]
  description: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}

export default function GenerateDocumentPage() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [selectedType, setSelectedType] = useState<string>("")
  const [facilityName, setFacilityName] = useState("医療法人さくらクリニック")
  const [facilityType, setFacilityType] = useState("診療所")
  const [address, setAddress] = useState("東京都港区六本木1-2-3")
  const [directorName, setDirectorName] = useState("山田 太郎")
  const [additionalData, setAdditionalData] = useState("")

  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [error, setError] = useState("")

  // 書類タイプ一覧を取得
  useEffect(() => {
    fetchDocumentTypes()
  }, [])

  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch("/api/generate-document")
      if (response.ok) {
        const data = await response.json()
        setDocumentTypes(data.documentTypes || [])
      }
    } catch (error) {
      console.error("書類タイプ取得エラー:", error)
    }
  }

  const handleGenerate = async () => {
    if (!selectedType) {
      setError("書類タイプを選択してください")
      return
    }

    setGenerating(true)
    setError("")
    setGeneratedContent("")
    setValidation(null)

    try {
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentType: selectedType,
          facilityData: {
            name: facilityName,
            type: facilityType,
            address: address,
            directorName: directorName,
          },
          additionalData: additionalData ? JSON.parse(additionalData) : {},
          previousReports: [],
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedContent(data.content)
        setValidation(data.validation)
      } else {
        setError(data.error || "書類の生成に失敗しました")
      }
    } catch (error: any) {
      console.error("生成エラー:", error)
      setError(error.message || "書類の生成に失敗しました")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
    alert("クリップボードにコピーしました")
  }

  const handleDownload = () => {
    const selectedDoc = documentTypes.find((d) => d.type === selectedType)
    const filename = `${selectedDoc?.name || "書類"}_${new Date().toISOString().split("T")[0]}.txt`

    const blob = new Blob([generatedContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI書類自動生成</h1>
        <p className="text-sm text-gray-500 mt-1">
          OpenAI APIを使用して医療関連書類を自動生成します
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左カラム: 入力フォーム */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>書類情報</CardTitle>
              <CardDescription>
                生成する書類の種類と施設情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 書類タイプ選択 */}
              <div className="space-y-2">
                <Label htmlFor="documentType">書類タイプ</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="書類タイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((docType) => (
                      <SelectItem key={docType.type} value={docType.type}>
                        {docType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType && (
                  <p className="text-xs text-gray-500">
                    {documentTypes.find((d) => d.type === selectedType)?.description}
                  </p>
                )}
              </div>

              {/* 施設名 */}
              <div className="space-y-2">
                <Label htmlFor="facilityName">施設名</Label>
                <Input
                  id="facilityName"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="医療法人さくらクリニック"
                />
              </div>

              {/* 施設種別 */}
              <div className="space-y-2">
                <Label htmlFor="facilityType">施設種別</Label>
                <Input
                  id="facilityType"
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                  placeholder="診療所"
                />
              </div>

              {/* 所在地 */}
              <div className="space-y-2">
                <Label htmlFor="address">所在地</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="東京都港区六本木1-2-3"
                />
              </div>

              {/* 管理者名 */}
              <div className="space-y-2">
                <Label htmlFor="directorName">管理者氏名</Label>
                <Input
                  id="directorName"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="山田 太郎"
                />
              </div>

              {/* 追加情報 */}
              <div className="space-y-2">
                <Label htmlFor="additionalData">
                  追加情報（JSON形式、任意）
                </Label>
                <Textarea
                  id="additionalData"
                  value={additionalData}
                  onChange={(e) => setAdditionalData(e.target.value)}
                  placeholder='{"reportPeriod": "令和6年4月1日～令和6年9月30日"}'
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  例: インシデント報告書の場合、発生日時やレベルなどを指定
                </p>
              </div>

              {/* 生成ボタン */}
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedType}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI生成を実行
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 必須項目 */}
          {selectedType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">必須記載事項</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-gray-600">
                  {documentTypes
                    .find((d) => d.type === selectedType)
                    ?.requiredFields.map((field, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{field}</span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右カラム: 生成結果 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>生成結果</CardTitle>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-1" />
                      コピー
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" />
                      ダウンロード
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!generatedContent && !generating && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p>書類を生成すると、ここに結果が表示されます</p>
                </div>
              )}

              {generating && (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-blue-500 animate-spin" />
                  <p className="text-gray-600">AI が書類を生成しています...</p>
                  <p className="text-xs text-gray-400 mt-2">
                    30秒ほどお待ちください
                  </p>
                </div>
              )}

              {generatedContent && (
                <div className="space-y-4">
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    ⚠️ 生成された内容は必ず人間が最終確認してください
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 検証結果 */}
          {validation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">検証結果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* エラー */}
                {validation.errors.length > 0 && (
                  <div className="space-y-2">
                    {validation.errors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm text-red-700"
                      >
                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 警告 */}
                {validation.warnings.length > 0 && (
                  <div className="space-y-2">
                    {validation.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm text-yellow-700"
                      >
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 情報 */}
                {validation.info.length > 0 && (
                  <div className="space-y-2">
                    {validation.info.map((info, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm text-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{info}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
