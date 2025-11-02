"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Sparkles, Loader2 } from "lucide-react"

interface Patient {
  id: string
  patientNumber: string
  lastName: string
  firstName: string
}

interface IncidentFormDialogProps {
  onSuccess?: () => void
}

export function IncidentFormDialog({ onSuccess }: IncidentFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])

  const [incidentType, setIncidentType] = useState("SYSTEM_FAILURE")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("MEDIUM")
  const [occurredAt, setOccurredAt] = useState("")
  const [discoveredAt, setDiscoveredAt] = useState("")
  const [location, setLocation] = useState("")
  const [affectedPatientId, setAffectedPatientId] = useState("none")
  const [analyzeWithAI, setAnalyzeWithAI] = useState(true)

  useEffect(() => {
    if (open) {
      fetchPatients()
      // Set default dates to now
      const now = new Date()
      const dateString = now.toISOString().slice(0, 16)
      setOccurredAt(dateString)
      setDiscoveredAt(dateString)
    }
  }, [open])

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients?limit=100")
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error("患者リスト取得エラー:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !occurredAt || !discoveredAt) {
      alert("必須項目を入力してください")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentType,
          title,
          description,
          severity,
          occurredAt: new Date(occurredAt).toISOString(),
          discoveredAt: new Date(discoveredAt).toISOString(),
          location: location || undefined,
          affectedPatientId: affectedPatientId === "none" ? undefined : affectedPatientId,
          analyzeWithAI,
        }),
      })

      if (response.ok) {
        resetForm()
        setOpen(false)
        onSuccess?.()
      } else {
        const error = await response.json()
        alert(`エラー: ${error.error || "インシデント登録に失敗しました"}`)
      }
    } catch (error) {
      console.error("インシデント登録エラー:", error)
      alert("インシデント登録に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setIncidentType("SYSTEM_FAILURE")
    setTitle("")
    setDescription("")
    setSeverity("MEDIUM")
    setLocation("")
    setAffectedPatientId("none")
    setAnalyzeWithAI(true)
    const now = new Date()
    const dateString = now.toISOString().slice(0, 16)
    setOccurredAt(dateString)
    setDiscoveredAt(dateString)
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        新規インシデント報告
      </Button>
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        新規インシデント報告
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">新規インシデント報告</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* インシデントタイプ */}
              <div className="space-y-2">
                <Label htmlFor="incidentType">
                  インシデントタイプ <span className="text-red-500">*</span>
                </Label>
                <Select value={incidentType} onValueChange={setIncidentType}>
                  <SelectTrigger id="incidentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFORMATION_LEAK">情報漏洩</SelectItem>
                    <SelectItem value="SYSTEM_FAILURE">システム障害</SelectItem>
                    <SelectItem value="CONSENT_DEFICIENCY">同意書不備</SelectItem>
                    <SelectItem value="MEDICAL_ERROR">医療過誤</SelectItem>
                    <SelectItem value="INFECTION">感染症</SelectItem>
                    <SelectItem value="EQUIPMENT_FAILURE">機器故障</SelectItem>
                    <SelectItem value="OTHER">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* タイトル */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  タイトル <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="インシデントの概要を入力してください"
                  required
                />
              </div>

              {/* 詳細説明 */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  詳細説明 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="インシデントの詳細を記入してください"
                  rows={6}
                  required
                />
              </div>

              {/* 深刻度 */}
              <div className="space-y-2">
                <Label htmlFor="severity">
                  深刻度 <span className="text-red-500">*</span>
                </Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">低</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="HIGH">高</SelectItem>
                    <SelectItem value="CRITICAL">緊急</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 発生日時と発見日時 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occurredAt">
                    発生日時 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="occurredAt"
                    type="datetime-local"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discoveredAt">
                    発見日時 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="discoveredAt"
                    type="datetime-local"
                    value={discoveredAt}
                    onChange={(e) => setDiscoveredAt(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 発生場所 */}
              <div className="space-y-2">
                <Label htmlFor="location">発生場所（任意）</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例: 2階 診察室A"
                />
              </div>

              {/* 影響を受けた患者 */}
              <div className="space-y-2">
                <Label htmlFor="affectedPatientId">影響を受けた患者（任意）</Label>
                <Select value={affectedPatientId} onValueChange={setAffectedPatientId}>
                  <SelectTrigger id="affectedPatientId">
                    <SelectValue placeholder="患者を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.patientNumber} - {patient.lastName} {patient.firstName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AI分析オプション */}
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <Checkbox
                  id="analyzeWithAI"
                  checked={analyzeWithAI}
                  onCheckedChange={(checked) => setAnalyzeWithAI(checked as boolean)}
                />
                <Label
                  htmlFor="analyzeWithAI"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  AIによる分析と対応策の自動提案を実行
                </Label>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    "インシデントを登録"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
