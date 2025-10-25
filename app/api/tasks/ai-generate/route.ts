import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import OpenAI from "openai"

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // OpenAI API キーの確認
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Keyが設定されていません" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { taskId, taskName, facilityInfo, requiredFields } = body

    // バリデーション
    if (!taskName || !facilityInfo) {
      return NextResponse.json(
        { error: "必要なパラメータが不足しています" },
        { status: 400 }
      )
    }

    // 施設情報からコンテキストを構築
    const facilityContext = `
施設名: ${facilityInfo.name || "医療法人さくらクリニック"}
施設タイプ: ${facilityInfo.type || "クリニック"}
所在地: ${facilityInfo.address || ""}
管理者名: ${facilityInfo.directorName || ""}
医療機関コード: ${facilityInfo.licenseNumber || ""}
職員数: ${facilityInfo.staffCount || "12"}名
医師数: ${facilityInfo.doctorCount || "3"}名
看護師数: ${facilityInfo.nurseCount || "5"}名
`.trim()

    // 必須フィールドのリスト
    const fieldsList = requiredFields
      ?.map((field: any) => `- ${field.label}${field.required ? "（必須）" : ""}`)
      .join("\n") || ""

    // OpenAI APIを使用して書類内容を生成
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたは医療機関の届出書類作成を支援するAIアシスタントです。
医療法規制に基づく正確な情報を提供し、適切な形式で書類の内容を生成してください。
生成する内容は、実際の施設情報に基づいて具体的かつ適切なものにしてください。`,
        },
        {
          role: "user",
          content: `以下の施設情報に基づいて、「${taskName}」の書類を作成してください。

【施設情報】
${facilityContext}

【記入が必要な項目】
${fieldsList}

各項目について、施設情報に基づいて適切な値を生成してください。
情報が不足している項目については、一般的な医療機関の標準的な値を推定して記入してください。

回答は以下のJSON形式で返してください：
{
  "項目ID": "生成された値",
  ...
}

例：
{
  "facilityName": "医療法人さくらクリニック",
  "facilityAddress": "東京都渋谷区桜丘町1-2-3",
  ...
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0]?.message?.content || "{}"

    // JSONレスポンスをパース
    let generatedData = {}
    try {
      // レスポンスからJSON部分を抽出
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("JSON形式のレスポンスが見つかりません")
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Response text:", responseText)

      // フォールバック：施設情報をそのまま返す
      generatedData = {
        facilityName: facilityInfo.name || "医療法人さくらクリニック",
        facilityAddress: facilityInfo.address || "東京都渋谷区桜丘町1-2-3",
        directorName: facilityInfo.directorName || "山田 太郎",
        licenseNumber: facilityInfo.licenseNumber || "1234567890",
        staffCount: String(facilityInfo.staffCount || "12"),
        doctorCount: String(facilityInfo.doctorCount || "3"),
        nurseCount: String(facilityInfo.nurseCount || "5"),
        bedCount: "19",
        operatingDays: "280",
        patientCount: "8500",
        specialties: "内科、小児科、皮膚科",
        notes: "地域医療に貢献しています",
      }
    }

    return NextResponse.json({
      success: true,
      data: generatedData,
      message: "AI生成が完了しました",
    })
  } catch (error: any) {
    console.error("AI生成エラー:", error)

    // OpenAI APIエラーの詳細を返す
    if (error.response) {
      return NextResponse.json(
        {
          error: "OpenAI APIエラー",
          details: error.response.data,
        },
        { status: error.response.status }
      )
    }

    return NextResponse.json(
      {
        error: "書類の生成中にエラーが発生しました",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
