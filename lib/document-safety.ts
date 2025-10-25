/**
 * 書類生成のセーフティ機能
 * - 個人情報マスキング
 * - 妥当性検証
 */

/**
 * 個人情報のパターン
 */
const PII_PATTERNS = {
  // 電話番号: 03-1234-5678, 090-1234-5678など
  phoneNumber: /\b0\d{1,4}-?\d{1,4}-?\d{4}\b/g,

  // 郵便番号: 123-4567
  postalCode: /\b\d{3}-?\d{4}\b/g,

  // メールアドレス
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // マイナンバー: 12桁の数字
  mynumber: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // 保険証番号: 8桁の数字
  insuranceNumber: /\b\d{8}\b/g,

  // クレジットカード番号: 16桁の数字（4桁ずつ区切りも対応）
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // 生年月日: YYYY/MM/DD, YYYY-MM-DD, YYYY年MM月DD日
  birthdate: /\b\d{4}[年/-]\d{1,2}[月/-]\d{1,2}日?\b/g,

  // 氏名のパターン（姓名の間にスペースがある場合）
  // 注: これは非常に簡易的な実装で、誤検知の可能性がある
  fullName: /([一-龯ぁ-んァ-ヶ]{2,5})\s+([一-龯ぁ-んァ-ヶ]{2,5})/g,
}

/**
 * 個人情報をマスキング
 */
export function maskPersonalInfo(text: string): {
  maskedText: string
  detectedPatterns: string[]
} {
  let maskedText = text
  const detectedPatterns: string[] = []

  // 電話番号をマスキング
  if (PII_PATTERNS.phoneNumber.test(text)) {
    maskedText = maskedText.replace(PII_PATTERNS.phoneNumber, "XXX-XXXX-XXXX")
    detectedPatterns.push("電話番号")
  }

  // 郵便番号をマスキング
  if (PII_PATTERNS.postalCode.test(text)) {
    maskedText = maskedText.replace(PII_PATTERNS.postalCode, "XXX-XXXX")
    detectedPatterns.push("郵便番号")
  }

  // メールアドレスをマスキング
  if (PII_PATTERNS.email.test(text)) {
    maskedText = maskedText.replace(PII_PATTERNS.email, "xxxx@example.com")
    detectedPatterns.push("メールアドレス")
  }

  // マイナンバーをマスキング
  if (PII_PATTERNS.mynumber.test(text)) {
    maskedText = maskedText.replace(PII_PATTERNS.mynumber, "XXXX-XXXX-XXXX")
    detectedPatterns.push("マイナンバー")
  }

  // 保険証番号をマスキング
  if (PII_PATTERNS.insuranceNumber.test(text)) {
    maskedText = maskedText.replace(PII_PATTERNS.insuranceNumber, "XXXXXXXX")
    detectedPatterns.push("保険証番号")
  }

  // クレジットカード番号をマスキング
  if (PII_PATTERNS.creditCard.test(text)) {
    maskedText = maskedText.replace(PII_PATTERNS.creditCard, "XXXX-XXXX-XXXX-XXXX")
    detectedPatterns.push("クレジットカード番号")
  }

  // 生年月日をマスキング
  if (PII_PATTERNS.birthdate.test(text)) {
    maskedText = maskedText.replace(PII_PATTERNS.birthdate, "XXXX年XX月XX日")
    detectedPatterns.push("生年月日")
  }

  return {
    maskedText,
    detectedPatterns: [...new Set(detectedPatterns)], // 重複を除去
  }
}

/**
 * 個人情報が含まれているかチェック
 */
export function containsPersonalInfo(text: string): {
  hasPersonalInfo: boolean
  patterns: string[]
} {
  const { detectedPatterns } = maskPersonalInfo(text)
  return {
    hasPersonalInfo: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  }
}

/**
 * 必須項目のチェック
 */
export function validateRequiredFields(
  generatedText: string,
  requiredFields: string[]
): {
  valid: boolean
  missingFields: string[]
  presentFields: string[]
} {
  const missingFields: string[] = []
  const presentFields: string[] = []

  for (const field of requiredFields) {
    // フィールド名またはその一部が含まれているかチェック
    const fieldVariations = [
      field,
      field.replace(/\s+/g, ""), // スペースを除去
      field.replace(/の/, ""), // 「の」を除去
    ]

    const isPresent = fieldVariations.some((variation) =>
      generatedText.includes(variation)
    )

    if (isPresent) {
      presentFields.push(field)
    } else {
      missingFields.push(field)
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    presentFields,
  }
}

/**
 * 文字数のチェック
 */
export function validateLength(
  text: string,
  minLength: number = 500,
  maxLength: number = 10000
): {
  valid: boolean
  length: number
  message?: string
} {
  const length = text.length

  if (length < minLength) {
    return {
      valid: false,
      length,
      message: `文書が短すぎます（最低${minLength}文字必要、現在${length}文字）`,
    }
  }

  if (length > maxLength) {
    return {
      valid: false,
      length,
      message: `文書が長すぎます（最大${maxLength}文字、現在${length}文字）`,
    }
  }

  return {
    valid: true,
    length,
  }
}

/**
 * 不適切な表現のチェック
 */
const INAPPROPRIATE_PATTERNS = [
  /個人を特定/,
  /氏名：.+/,
  /名前：.+/,
  /患者名：.+/,
  /職員名：.+/,
  /ミス/,
  /過失/,
  /責任/,
]

export function checkInappropriateContent(text: string): {
  hasIssues: boolean
  issues: string[]
} {
  const issues: string[] = []

  // 個人を特定する表現
  if (/氏名[：:]\s*[一-龯ぁ-んァ-ヶー]{2,}/.test(text)) {
    issues.push("個人名が含まれている可能性があります")
  }

  // 患者名の記載
  if (/患者[：:]\s*[一-龯ぁ-んァ-ヶー]{2,}/.test(text)) {
    issues.push("患者名が含まれている可能性があります")
  }

  // 職員名の記載
  if (/職員[：:]\s*[一-龯ぁ-んァ-ヶー]{2,}/.test(text)) {
    issues.push("職員名が含まれている可能性があります")
  }

  // 個人を責める表現
  const blamingWords = ["ミス", "過失", "責任", "犯人", "悪い"]
  for (const word of blamingWords) {
    if (text.includes(word)) {
      issues.push(`「${word}」という表現が含まれています。システム改善の観点から記述してください。`)
    }
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  }
}

/**
 * 総合的な妥当性検証
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}

export function validateDocumentContent(
  generatedText: string,
  requiredFields: string[],
  options: {
    minLength?: number
    maxLength?: number
    checkPersonalInfo?: boolean
    checkInappropriate?: boolean
  } = {}
): ValidationResult {
  const {
    minLength = 500,
    maxLength = 10000,
    checkPersonalInfo = true,
    checkInappropriate = true,
  } = options

  const errors: string[] = []
  const warnings: string[] = []
  const info: string[] = []

  // 文字数チェック
  const lengthCheck = validateLength(generatedText, minLength, maxLength)
  if (!lengthCheck.valid && lengthCheck.message) {
    errors.push(lengthCheck.message)
  } else {
    info.push(`文字数: ${lengthCheck.length}文字`)
  }

  // 必須項目チェック
  const fieldsCheck = validateRequiredFields(generatedText, requiredFields)
  if (!fieldsCheck.valid) {
    errors.push(`必須項目が不足しています: ${fieldsCheck.missingFields.join("、")}`)
  } else {
    info.push(`すべての必須項目が含まれています（${fieldsCheck.presentFields.length}項目）`)
  }

  // 個人情報チェック
  if (checkPersonalInfo) {
    const piiCheck = containsPersonalInfo(generatedText)
    if (piiCheck.hasPersonalInfo) {
      warnings.push(
        `個人情報が含まれている可能性があります: ${piiCheck.patterns.join("、")}`
      )
    } else {
      info.push("個人情報は検出されませんでした")
    }
  }

  // 不適切な表現チェック
  if (checkInappropriate) {
    const inappropriateCheck = checkInappropriateContent(generatedText)
    if (inappropriateCheck.hasIssues) {
      warnings.push(...inappropriateCheck.issues)
    } else {
      info.push("不適切な表現は検出されませんでした")
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
  }
}

/**
 * 生成された文書をサニタイズ
 */
export function sanitizeDocument(text: string): string {
  // 個人情報をマスキング
  const { maskedText } = maskPersonalInfo(text)

  // HTMLタグを除去
  let sanitized = maskedText.replace(/<[^>]*>/g, "")

  // 連続する空白を1つにまとめる
  sanitized = sanitized.replace(/\s+/g, " ")

  // 前後の空白を削除
  sanitized = sanitized.trim()

  return sanitized
}
