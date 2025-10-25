/**
 * 書類生成用のプロンプトテンプレート管理システム
 */

export type DocumentType =
  | "MEDICAL_SAFETY_REPORT" // 医療安全管理報告書
  | "CLINIC_OPENING_RENEWAL" // 診療所開設届更新申請書
  | "INCIDENT_REPORT" // インシデント報告書

export interface FacilityData {
  name: string
  type: string
  address: string
  directorName: string
  licenseNumber?: string
  phoneNumber?: string
  bedCount?: number
  staffCount?: number
  doctorCount?: number
  nurseCount?: number
  departments?: string[]
}

export interface DocumentGenerationContext {
  documentType: DocumentType
  facilityData: FacilityData
  previousReports?: string[]
  additionalData?: Record<string, any>
  requiredFields?: string[]
}

/**
 * 医療安全管理報告書のプロンプトテンプレート
 */
export const getMedicalSafetyReportPrompt = (
  context: DocumentGenerationContext
): string => {
  const { facilityData, previousReports, additionalData } = context

  return `あなたは日本の医療法規に詳しい専門家です。医療安全管理報告書を作成してください。

【施設情報】
- 施設名: ${facilityData.name}
- 施設種別: ${facilityData.type}
- 所在地: ${facilityData.address}
- 管理者: ${facilityData.directorName}
- 医療機関コード: ${facilityData.licenseNumber || "未登録"}
- 病床数: ${facilityData.bedCount || "なし"}
- 職員数: ${facilityData.staffCount || "不明"}
  - 医師: ${facilityData.doctorCount || "不明"}名
  - 看護師: ${facilityData.nurseCount || "不明"}名

【報告期間】
${additionalData?.reportPeriod || "令和XX年XX月XX日 ～ 令和XX年XX月XX日"}

【過去の報告書の参考情報】
${previousReports && previousReports.length > 0 ? previousReports.join("\n") : "過去の報告書はありません"}

【必須記載事項】
1. 医療安全管理体制の整備状況
   - 医療安全管理者の配置状況
   - 医療安全管理委員会の開催状況
   - 医療安全に関する職員研修の実施状況
   - 医療事故等の報告体制

2. 医療安全に関する取り組み
   - 医療安全に関する基本的な考え方
   - 具体的な取り組み内容
   - 改善活動の実績

3. インシデント・アクシデントの発生状況
   - 発生件数（レベル別）
   - 主な事例と再発防止策
   - 分析結果と今後の対策

4. 院内感染対策
   - 院内感染対策委員会の活動状況
   - 感染症発生状況
   - 予防対策の実施状況

5. 医薬品・医療機器の安全管理
   - 医薬品の安全使用のための体制
   - 医療機器の保守点検状況

【作成上の注意】
- 医療法施行規則第1条の11第2項に準拠した内容にすること
- 具体的な数値データを含めること
- 客観的かつ正確な記述を心がけること
- 個人情報は含めないこと（患者名、職員名など）
- 形式は「である調」で統一すること

上記の情報を基に、医療安全管理報告書を作成してください。`
}

/**
 * 診療所開設届更新申請書のプロンプトテンプレート
 */
export const getClinicOpeningRenewalPrompt = (
  context: DocumentGenerationContext
): string => {
  const { facilityData, additionalData } = context

  return `あなたは日本の医療法規に詳しい専門家です。診療所開設届の更新申請書を作成してください。

【施設情報】
- 診療所名: ${facilityData.name}
- 所在地: ${facilityData.address}
- 開設者氏名: ${facilityData.directorName}
- 電話番号: ${facilityData.phoneNumber || "未登録"}
- 診療科目: ${facilityData.departments?.join("、") || "内科"}

【更新内容】
${additionalData?.updateReason || "定期更新"}

【変更事項】
${additionalData?.changes || "変更なし"}

【必須記載事項】
1. 開設者に関する事項
   - 氏名（法人の場合は名称及び代表者氏名）
   - 住所（法人の場合は主たる事務所の所在地）

2. 診療所に関する事項
   - 名称
   - 所在地
   - 診療科目
   - 病床の種別及び数（該当する場合）

3. 管理者に関する事項
   - 氏名
   - 医籍登録番号
   - 医師免許取得年月日

4. 構造設備の概要
   - 敷地面積
   - 建物面積
   - 診察室、処置室等の設備
   - 医療機器の概要

5. 診療に従事する医師その他の従業員の定員
   - 医師
   - 看護師
   - その他の医療従事者

【作成上の注意】
- 医療法第8条及び医療法施行規則第1条に準拠すること
- すべての項目を正確に記載すること
- 添付書類（医師免許証の写し、平面図等）の準備が必要であることを明記すること
- 形式は「です・ます調」で統一すること

上記の情報を基に、診療所開設届更新申請書を作成してください。`
}

/**
 * インシデント報告書のプロンプトテンプレート
 */
export const getIncidentReportPrompt = (
  context: DocumentGenerationContext
): string => {
  const { facilityData, additionalData } = context

  return `あなたは医療安全管理の専門家です。インシデント報告書を作成してください。

【施設情報】
- 施設名: ${facilityData.name}
- 報告日: ${additionalData?.reportDate || new Date().toLocaleDateString("ja-JP")}

【インシデント情報】
- 発生日時: ${additionalData?.incidentDate || "未記入"}
- 発生場所: ${additionalData?.location || "未記入"}
- インシデントレベル: ${additionalData?.level || "レベル1（エラーや医薬品・医療用具の不具合が見られたが、患者には実施されなかった）"}
- 当事者: ${additionalData?.involvedStaff || "（職種・経験年数のみ記載、個人名は記載しない）"}
- 発見者: ${additionalData?.discoverer || "（職種のみ記載）"}

【必須記載事項】
1. インシデントの概要
   - 何が起きたのか（客観的事実）
   - いつ発生したか
   - どこで発生したか
   - 誰が関わったか（職種・経験年数のみ）
   - なぜ起きたか（推定原因）

2. インシデント発生時の状況
   - 患者の状態
   - 業務の繁忙度
   - 環境要因

3. インシデント発生後の対応
   - 発見時の対応
   - 患者への説明
   - 応急処置・治療

4. 影響度評価
   - 患者への影響（レベル0～5）
   - 継続的な観察の必要性

5. 原因分析
   - 直接的な原因
   - 背景要因（システム、環境、教育等）
   - RCA（根本原因分析）の結果

6. 再発防止策
   - 短期的な対策
   - 長期的な対策
   - システム改善の提案
   - 教育・研修計画

【作成上の注意】
- 個人を責めるのではなく、システムの改善を目的とすること
- 患者名や職員の個人名は記載しないこと
- 客観的な事実のみを記載し、推測と事実を明確に区別すること
- 5W1H（いつ、どこで、誰が、何を、なぜ、どのように）を明確にすること
- 形式は「である調」で統一すること

上記の情報を基に、インシデント報告書を作成してください。`
}

/**
 * ドキュメントタイプに応じたプロンプトを取得
 */
export const getDocumentPrompt = (
  context: DocumentGenerationContext
): string => {
  switch (context.documentType) {
    case "MEDICAL_SAFETY_REPORT":
      return getMedicalSafetyReportPrompt(context)
    case "CLINIC_OPENING_RENEWAL":
      return getClinicOpeningRenewalPrompt(context)
    case "INCIDENT_REPORT":
      return getIncidentReportPrompt(context)
    default:
      throw new Error(`Unknown document type: ${context.documentType}`)
  }
}

/**
 * ドキュメントタイプの必須フィールドを取得
 */
export const getRequiredFields = (documentType: DocumentType): string[] => {
  switch (documentType) {
    case "MEDICAL_SAFETY_REPORT":
      return [
        "医療安全管理体制の整備状況",
        "医療安全に関する取り組み",
        "インシデント・アクシデントの発生状況",
        "院内感染対策",
        "医薬品・医療機器の安全管理",
      ]
    case "CLINIC_OPENING_RENEWAL":
      return [
        "開設者に関する事項",
        "診療所に関する事項",
        "管理者に関する事項",
        "構造設備の概要",
        "診療に従事する医師その他の従業員の定員",
      ]
    case "INCIDENT_REPORT":
      return [
        "インシデントの概要",
        "インシデント発生時の状況",
        "インシデント発生後の対応",
        "影響度評価",
        "原因分析",
        "再発防止策",
      ]
    default:
      return []
  }
}

/**
 * ドキュメントタイプの日本語名を取得
 */
export const getDocumentTypeName = (documentType: DocumentType): string => {
  switch (documentType) {
    case "MEDICAL_SAFETY_REPORT":
      return "医療安全管理報告書"
    case "CLINIC_OPENING_RENEWAL":
      return "診療所開設届更新申請書"
    case "INCIDENT_REPORT":
      return "インシデント報告書"
    default:
      return "不明な書類"
  }
}
