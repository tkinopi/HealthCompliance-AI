import OpenAI from "openai"

/**
 * OpenAI APIユーティリティ（レート制限、エラーハンドリング対応）
 */

// OpenAIクライアントのシングルトンインスタンス
let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

/**
 * リトライ設定
 */
interface RetryConfig {
  maxRetries: number
  baseDelay: number // ミリ秒
  maxDelay: number // ミリ秒
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
}

/**
 * 指数バックオフによる遅延計算
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(2, attempt),
    config.maxDelay
  )
  // ジッター（ランダムな揺らぎ）を追加
  return delay + Math.random() * 1000
}

/**
 * sleep関数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * OpenAI APIエラーの判定
 */
function isRetryableError(error: any): boolean {
  // レート制限エラー
  if (error?.status === 429) return true

  // サーバーエラー
  if (error?.status >= 500) return true

  // タイムアウトエラー
  if (error?.code === "ETIMEDOUT") return true
  if (error?.code === "ECONNRESET") return true

  return false
}

/**
 * Chat Completion APIの呼び出し（リトライ機能付き）
 */
export async function createChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    retryConfig?: RetryConfig
  } = {}
): Promise<string> {
  const {
    model = "gpt-4o-mini",
    temperature = 0.3, // 正確性重視
    maxTokens = 3000,
    retryConfig = DEFAULT_RETRY_CONFIG,
  } = options

  const client = getOpenAIClient()
  let lastError: any

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      console.log(`🤖 [OpenAI] API呼び出し試行 ${attempt + 1}/${retryConfig.maxRetries + 1}`)

      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      })

      const content = completion.choices[0]?.message?.content

      if (!content) {
        throw new Error("OpenAI API returned empty content")
      }

      console.log(`✅ [OpenAI] API呼び出し成功`)
      return content
    } catch (error: any) {
      lastError = error
      console.error(`❌ [OpenAI] API呼び出しエラー (試行 ${attempt + 1}):`, error)

      // リトライ可能なエラーかチェック
      if (!isRetryableError(error)) {
        console.error(`⚠️ [OpenAI] リトライ不可能なエラー`)
        throw error
      }

      // 最後の試行だった場合はエラーをスロー
      if (attempt === retryConfig.maxRetries) {
        console.error(`⚠️ [OpenAI] 最大リトライ回数に達しました`)
        throw error
      }

      // バックオフ遅延
      const delay = calculateBackoffDelay(attempt, retryConfig)
      console.log(`⏳ [OpenAI] ${Math.round(delay)}ms待機後にリトライします...`)
      await sleep(delay)
    }
  }

  // ここに到達することはないはずだが、念のため
  throw lastError || new Error("Unknown error occurred")
}

/**
 * ストリーミング対応のChat Completion
 */
export async function* streamChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
  } = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = "gpt-4o-mini",
    temperature = 0.3,
    maxTokens = 3000,
  } = options

  const client = getOpenAIClient()

  try {
    console.log(`🤖 [OpenAI] ストリーミングAPI呼び出し開始`)

    const stream = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }

    console.log(`✅ [OpenAI] ストリーミングAPI呼び出し完了`)
  } catch (error) {
    console.error(`❌ [OpenAI] ストリーミングAPIエラー:`, error)
    throw error
  }
}

/**
 * トークン数の推定（簡易版）
 */
export function estimateTokenCount(text: string): number {
  // 日本語を考慮した簡易的な推定
  // 1トークン ≈ 4文字（英語）、1トークン ≈ 2文字（日本語）と仮定
  const japaneseCharCount = (text.match(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || []).length
  const otherCharCount = text.length - japaneseCharCount

  return Math.ceil(japaneseCharCount / 2 + otherCharCount / 4)
}

/**
 * レート制限チェック（簡易版）
 */
const rateLimitCache = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const cache = rateLimitCache.get(key)

  if (!cache || now > cache.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (cache.count >= limit) {
    return false
  }

  cache.count++
  return true
}

/**
 * エラーメッセージの取得
 */
export function getErrorMessage(error: any): string {
  if (error?.status === 429) {
    return "API呼び出しのレート制限に達しました。しばらく待ってから再試行してください。"
  }

  if (error?.status === 401) {
    return "OpenAI APIキーが無効です。設定を確認してください。"
  }

  if (error?.status >= 500) {
    return "OpenAIのサーバーでエラーが発生しました。しばらく待ってから再試行してください。"
  }

  if (error?.message) {
    return error.message
  }

  return "不明なエラーが発生しました。"
}
