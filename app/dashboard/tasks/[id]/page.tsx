"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Send,
  Sparkles,
  Eye,
  FileText,
  Calendar,
  User,
  Building2,
  Clock,
  CheckCircle2,
  Download,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { generateAndDownloadDocumentPDF } from "@/lib/pdf-generator"
import { printAsJapanesePDF } from "@/lib/pdf-generator-jp"

// サンプルタスクデータ（本来はAPIから取得）
const sampleTask = {
  id: "1",
  name: "診療所開設届",
  facilityType: "CLINIC",
  dueDate: "2025-12-31",
  status: "NOT_STARTED",
  assignedTo: "山田 太郎",
  description: "年1回の診療所開設届の提出。医療機関の運営状況を保健所に報告する必要があります。",
  daysUntilDue: 81,
  regulatoryTaskId: "rt1",
  requiredFields: [
    {
      id: "facilityName",
      label: "施設名",
      type: "text",
      required: true,
      placeholder: "例：さくらクリニック",
    },
    {
      id: "facilityAddress",
      label: "施設所在地",
      type: "text",
      required: true,
      placeholder: "例：東京都渋谷区...",
    },
    {
      id: "directorName",
      label: "管理者氏名",
      type: "text",
      required: true,
      placeholder: "例：山田 太郎",
    },
    {
      id: "licenseNumber",
      label: "医療機関コード",
      type: "text",
      required: true,
      placeholder: "例：1234567890",
    },
    {
      id: "bedCount",
      label: "病床数",
      type: "number",
      required: false,
      placeholder: "例：19",
    },
    {
      id: "staffCount",
      label: "職員数",
      type: "number",
      required: true,
      placeholder: "例：12",
    },
    {
      id: "doctorCount",
      label: "医師数",
      type: "number",
      required: true,
      placeholder: "例：3",
    },
    {
      id: "nurseCount",
      label: "看護師数",
      type: "number",
      required: true,
      placeholder: "例：5",
    },
    {
      id: "operatingDays",
      label: "年間診療日数",
      type: "number",
      required: true,
      placeholder: "例：280",
    },
    {
      id: "patientCount",
      label: "年間患者数",
      type: "number",
      required: true,
      placeholder: "例：8500",
    },
    {
      id: "specialties",
      label: "診療科目",
      type: "textarea",
      required: true,
      placeholder: "例：内科、小児科、皮膚科",
    },
    {
      id: "notes",
      label: "備考",
      type: "textarea",
      required: false,
      placeholder: "その他特記事項があれば記入してください",
    },
  ],
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const totalSteps = 3 // 基本情報、詳細情報、確認

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleAIGenerate = async () => {
    setIsGenerating(true)

    try {
      // 施設情報を取得（本来はAPIまたはコンテキストから取得）
      const facilityInfo = {
        name: "医療法人さくらクリニック",
        type: "クリニック",
        address: "東京都渋谷区桜丘町1-2-3",
        directorName: "山田 太郎",
        licenseNumber: "1234567890",
        staffCount: 12,
        doctorCount: 3,
        nurseCount: 5,
      }

      // AI生成APIを呼び出し
      const response = await fetch("/api/tasks/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: params.id,
          taskName: sampleTask.name,
          facilityInfo,
          requiredFields: sampleTask.requiredFields,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "AI生成に失敗しました")
      }

      const result = await response.json()

      // 生成されたデータをフォームに設定
      setFormData(result.data)

      alert("AI生成が完了しました")
    } catch (error: any) {
      console.error("AI生成エラー:", error)
      alert(`エラー: ${error.message}`)

      // エラー時のフォールバック（サンプルデータ）
      setFormData({
        facilityName: "医療法人さくらクリニック",
        facilityAddress: "東京都渋谷区桜丘町1-2-3",
        directorName: "山田 太郎",
        licenseNumber: "1234567890",
        bedCount: "19",
        staffCount: "12",
        doctorCount: "3",
        nurseCount: "5",
        operatingDays: "280",
        patientCount: "8500",
        specialties: "内科、小児科、皮膚科",
        notes: "地域医療に貢献しています",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert("下書きを保存しました")
  }

  const validateForm = () => {
    const errors: string[] = []

    // 必須項目のチェック
    const requiredFields = sampleTask.requiredFields.filter((f) => f.required)
    const missingFields = requiredFields.filter((f) => !formData[f.id])

    if (missingFields.length > 0) {
      errors.push(`必須項目が未入力です：${missingFields.map((f) => f.label).join("、")}`)
    }

    // 数値フィールドの妥当性チェック
    sampleTask.requiredFields
      .filter((f) => f.type === "number" && formData[f.id])
      .forEach((field) => {
        const value = Number(formData[field.id])
        if (isNaN(value) || value < 0) {
          errors.push(`${field.label}に有効な数値を入力してください`)
        }
      })

    // 施設情報の整合性チェック
    if (formData.staffCount && formData.doctorCount && formData.nurseCount) {
      const staff = Number(formData.staffCount)
      const doctor = Number(formData.doctorCount)
      const nurse = Number(formData.nurseCount)

      if (doctor + nurse > staff) {
        errors.push("医師数と看護師数の合計が職員数を超えています")
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleCheckValidation = () => {
    const isValid = validateForm()
    if (isValid) {
      alert("✅ 記載内容に問題ありません")
    }
  }

  const handleSubmit = async () => {
    // バリデーション
    if (!validateForm()) {
      alert("入力内容に問題があります。エラーメッセージを確認してください。")
      return
    }

    if (confirm("書類を提出しますか？")) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      alert("書類を提出しました")
      router.push("/dashboard/tasks")
    }
  }

  const handleExportPDF = () => {
    // フィールドデータを整形
    const fields = sampleTask.requiredFields.map((field) => ({
      label: field.label,
      value: formData[field.id] || "---",
    }))

    // 日本語対応版PDF生成（ブラウザの印刷機能を使用）
    printAsJapanesePDF({
      documentTitle: sampleTask.name,
      facilityName: formData.facilityName || "医療法人さくらクリニック",
      dueDate: sampleTask.dueDate,
      fields,
    })
  }

  const handleExportEnglishPDF = () => {
    // フィールドデータを整形
    const fields = sampleTask.requiredFields.map((field) => ({
      label: field.label,
      value: formData[field.id] || "---",
    }))

    // 英語版PDF生成（英語ラベル）
    generateAndDownloadDocumentPDF({
      documentTitle: sampleTask.name,
      facilityName: formData.facilityName || "医療法人さくらクリニック",
      dueDate: sampleTask.dueDate,
      fields,
    })
  }

  const getStepFields = (step: number) => {
    const fieldsPerStep = Math.ceil(sampleTask.requiredFields.length / (totalSteps - 1))
    if (step === totalSteps) return [] // 確認ステップ
    const startIndex = (step - 1) * fieldsPerStep
    const endIndex = startIndex + fieldsPerStep
    return sampleTask.requiredFields.slice(startIndex, endIndex)
  }

  const currentFields = getStepFields(currentStep)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/tasks")}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{sampleTask.name}</h1>
            <p className="text-gray-600 mt-1">{sampleTask.description}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-lg px-4 py-2 border-orange-200 bg-orange-50 text-orange-700"
        >
          <Clock className="h-4 w-4 mr-2" />
          残り{sampleTask.daysUntilDue}日
        </Badge>
      </div>

      {/* タスク情報カード */}
      <Card className="border-blue-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">期限</p>
                <p className="text-lg font-semibold text-gray-900">{sampleTask.dueDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">担当者</p>
                <p className="text-lg font-semibold text-gray-900">{sampleTask.assignedTo}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">施設タイプ</p>
                <p className="text-lg font-semibold text-gray-900">クリニック</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">ステータス</p>
                <p className="text-lg font-semibold text-gray-900">未着手</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI自動生成ボタン */}
      <div className="flex justify-center">
        <Button
          onClick={handleAIGenerate}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          <Sparkles className={`h-5 w-5 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "AI生成中..." : "AIで書類を自動生成"}
        </Button>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step === currentStep
                  ? "bg-blue-600 text-white"
                  : step < currentStep
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step < currentStep ? <CheckCircle2 className="h-5 w-5" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-24 h-1 mx-2 ${
                  step < currentStep ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* バリデーションエラー表示 */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">入力内容に問題があります</h3>
                <ul className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-800">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* フォームカード */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle>
            {currentStep === 1
              ? "基本情報"
              : currentStep === 2
              ? "詳細情報"
              : "確認"}
          </CardTitle>
          <CardDescription>
            {currentStep === totalSteps
              ? "入力内容を確認して提出してください"
              : "必須項目には * が付いています"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === totalSteps ? (
            // 確認ステップ
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  入力内容を確認してください。問題なければ「提出する」ボタンをクリックしてください。
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sampleTask.requiredFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                      {formData[field.id] || <span className="text-gray-400">未入力</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 入力ステップ
            <div className="space-y-6">
              {currentFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.id}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    />
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  前へ
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "保存中..." : "下書き保存"}
              </Button>
              {currentStep === totalSteps && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCheckValidation}
                    className="border-purple-600 text-purple-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    記載漏れチェック
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF} className="border-blue-600 text-blue-600">
                    <Download className="h-4 w-4 mr-2" />
                    PDF出力
                  </Button>
                </>
              )}
              {currentStep < totalSteps ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)}>
                  次へ
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-2" />
                  提出する
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ヘルプカード */}
      <Card className="border-purple-100 bg-purple-50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-900 mb-2">AI書類作成支援について</p>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li>施設情報から必要事項を自動で入力します</li>
                <li>前回の提出内容を参考に下書きを生成します</li>
                <li>記載漏れや不備をチェックします</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
