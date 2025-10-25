import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createChatCompletion, checkRateLimit, getErrorMessage } from "@/lib/openai-utils"
import {
  type DocumentType,
  type DocumentGenerationContext,
  getDocumentPrompt,
  getRequiredFields,
  getDocumentTypeName,
} from "@/lib/document-templates"
import { validateDocumentContent, sanitizeDocument } from "@/lib/document-safety"

/**
 * POST /api/generate-document
 * 書類を自動生成するエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // リクエストボディを取得
    const body = await request.json()
    const {
      documentType,
      facilityData,
      previousReports,
      additionalData,
    } = body as DocumentGenerationContext

    console.log(`📝 [生成] 書類生成リクエスト: ${documentType}`)

    // バリデーション
    if (!documentType) {
      return NextResponse.json(
        { error: "documentTypeが必要です" },
        { status: 400 }
      )
    }

    if (!facilityData || !facilityData.name) {
      return NextResponse.json(
        { error: "施設情報が不足しています" },
        { status: 400 }
      )
    }

    // レート制限チェック（ユーザーごとに10回/分）
    const rateLimitKey = `generate-document:${session.user.id}`
    if (!checkRateLimit(rateLimitKey, 10, 60000)) {
      return NextResponse.json(
        { error: "リクエスト頻度が高すぎます。1分後に再試行してください。" },
        { status: 429 }
      )
    }

    // 必須フィールドを取得
    const requiredFields = getRequiredFields(documentType)

    // プロンプトを生成
    const context: DocumentGenerationContext = {
      documentType,
      facilityData,
      previousReports,
      additionalData,
      requiredFields,
    }

    const systemPrompt = getDocumentPrompt(context)

    console.log(`🤖 [生成] プロンプト作成完了、OpenAI API呼び出し中...`)

    // OpenAI APIで生成
    const generatedContent = await createChatCompletion(
      [
        {
          role: "system",
          content: "あなたは日本の医療法規に精通した専門家です。正確で適切な医療関連書類を作成することができます。",
        },
        {
          role: "user",
          content: systemPrompt,
        },
      ],
      {
        model: "gpt-4o-mini",
        temperature: 0.3, // 正確性重視
        maxTokens: 3000,
      }
    )

    console.log(`✅ [生成] OpenAI APIから応答を受信`)

    // 生成された内容を検証
    const validationResult = validateDocumentContent(
      generatedContent,
      requiredFields,
      {
        minLength: 300,
        maxLength: 10000,
        checkPersonalInfo: true,
        checkInappropriate: true,
      }
    )

    console.log(`🔍 [生成] 検証結果:`, {
      valid: validationResult.valid,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
    })

    // サニタイズ（個人情報マスキング、HTMLタグ除去）
    const sanitizedContent = sanitizeDocument(generatedContent)

    // レスポンスを返す
    return NextResponse.json({
      success: true,
      documentType,
      documentTypeName: getDocumentTypeName(documentType),
      content: sanitizedContent,
      originalContent: generatedContent, // デバッグ用（本番環境では削除推奨）
      validation: validationResult,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: session.user.id,
        facilityName: facilityData.name,
        requiredFieldsCount: requiredFields.length,
        contentLength: sanitizedContent.length,
      },
    })
  } catch (error: any) {
    console.error("❌ [生成] 書類生成エラー:", error)

    // OpenAI APIエラーの場合
    const errorMessage = getErrorMessage(error)

    return NextResponse.json(
      {
        error: "書類の生成に失敗しました",
        details: errorMessage,
      },
      { status: error?.status || 500 }
    )
  }
}

/**
 * GET /api/generate-document
 * サポートされている書類タイプの一覧を返す
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const documentTypes: Array<{
      type: DocumentType
      name: string
      requiredFields: string[]
      description: string
    }> = [
      {
        type: "MEDICAL_SAFETY_REPORT",
        name: "医療安全管理報告書",
        requiredFields: getRequiredFields("MEDICAL_SAFETY_REPORT"),
        description: "医療法施行規則第1条の11第2項に基づく医療安全管理の報告書",
      },
      {
        type: "CLINIC_OPENING_RENEWAL",
        name: "診療所開設届更新申請書",
        requiredFields: getRequiredFields("CLINIC_OPENING_RENEWAL"),
        description: "医療法第8条に基づく診療所の開設届の更新申請書",
      },
      {
        type: "INCIDENT_REPORT",
        name: "インシデント報告書",
        requiredFields: getRequiredFields("INCIDENT_REPORT"),
        description: "医療安全のためのインシデント（ヒヤリハット）報告書",
      },
    ]

    return NextResponse.json({
      success: true,
      documentTypes,
    })
  } catch (error) {
    console.error("❌ [生成] 書類タイプ一覧取得エラー:", error)
    return NextResponse.json(
      { error: "書類タイプ一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}
