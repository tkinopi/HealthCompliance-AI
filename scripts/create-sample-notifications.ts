import { db, client } from "@/lib/db"
import { notifications, users } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * サンプル通知を作成するスクリプト
 * 使用方法: npx tsx scripts/create-sample-notifications.ts
 */
async function main() {
  console.log("🔔 サンプル通知を作成しています...")

  try {
    // 管理者ユーザーを取得
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@clinic.jp"))
      .limit(1)

    if (!admin) {
      console.error("❌ 管理者ユーザーが見つかりません")
      process.exit(1)
    }

    console.log(`✓ ユーザーを見つけました: ${admin.name}`)

    // サンプル通知を作成
    const sampleNotifications = [
      // 緊急通知
      {
        userId: admin.id,
        organizationId: admin.organizationId,
        type: "URGENT" as const,
        category: "CONSENT_EXPIRY" as const,
        title: "【緊急】患者同意書の期限が本日です",
        message:
          "患者「田中 一郎」様の個人情報利用同意書が本日期限切れとなります。至急更新が必要です。",
        priority: "URGENT" as const,
        relatedId: "sample-consent-1",
        relatedType: "CONSENT" as const,
        actionUrl: "/dashboard/consents",
      },
      {
        userId: admin.id,
        organizationId: admin.organizationId,
        type: "URGENT" as const,
        category: "TASK_DUE" as const,
        title: "【緊急】届出書類の提出期限が3日後です",
        message:
          "「医療法人決算届」の提出期限が3日後に迫っています。至急作成を完了してください。",
        priority: "URGENT" as const,
        relatedId: "sample-task-1",
        relatedType: "TASK" as const,
        actionUrl: "/dashboard/tasks",
      },

      // 警告通知
      {
        userId: admin.id,
        organizationId: admin.organizationId,
        type: "WARNING" as const,
        category: "CONSENT_EXPIRY" as const,
        title: "患者同意書の期限が7日後です",
        message:
          "患者「高橋 美咲」様の診療情報提供同意書が7日後に期限切れとなります。更新準備を開始してください。",
        priority: "HIGH" as const,
        relatedId: "sample-consent-2",
        relatedType: "CONSENT" as const,
        actionUrl: "/dashboard/consents",
      },
      {
        userId: admin.id,
        organizationId: admin.organizationId,
        type: "WARNING" as const,
        category: "TASK_DUE" as const,
        title: "届出書類の提出期限が14日後です",
        message:
          "「医療安全管理報告」の提出期限が14日後です。早めの作成をお勧めします。",
        priority: "HIGH" as const,
        relatedId: "sample-task-2",
        relatedType: "TASK" as const,
        actionUrl: "/dashboard/tasks",
      },
      {
        userId: admin.id,
        organizationId: admin.organizationId,
        type: "WARNING" as const,
        category: "SECURITY_ALERT" as const,
        title: "深夜時間帯のアクセス検知",
        message:
          "山田 太郎（admin@clinic.jp）が深夜2時にアクセスしました。不審なアクセスがないか確認してください。",
        priority: "HIGH" as const,
        relatedId: admin.id,
        relatedType: "USER" as const,
        actionUrl: "/dashboard/activity",
      },

      // 情報通知
      {
        userId: admin.id,
        organizationId: admin.organizationId,
        type: "INFO" as const,
        category: "TASK_DUE" as const,
        title: "届出書類の提出期限が30日後です",
        message:
          "「院内感染対策報告」の提出期限が30日後です。計画的に作成を進めてください。",
        priority: "MEDIUM" as const,
        relatedId: "sample-task-3",
        relatedType: "TASK" as const,
        actionUrl: "/dashboard/tasks",
      },
      {
        userId: admin.id,
        organizationId: admin.organizationId,
        type: "INFO" as const,
        category: "CONSENT_EXPIRY" as const,
        title: "患者同意書の期限が30日後です",
        message:
          "患者「伊藤 健太」様の手術同意書が30日後に期限切れとなります。",
        priority: "MEDIUM" as const,
        relatedId: "sample-consent-3",
        relatedType: "CONSENT" as const,
        actionUrl: "/dashboard/consents",
      },
    ]

    // 通知を一括作成
    const createdNotifications = await db
      .insert(notifications)
      .values(sampleNotifications)
      .returning()

    console.log(`✅ ${createdNotifications.length}件のサンプル通知を作成しました`)

    // 通知の内訳を表示
    const urgentCount = createdNotifications.filter((n) => n.type === "URGENT").length
    const warningCount = createdNotifications.filter((n) => n.type === "WARNING").length
    const infoCount = createdNotifications.filter((n) => n.type === "INFO").length

    console.log("\n📊 通知の内訳:")
    console.log(`   緊急（赤）: ${urgentCount}件`)
    console.log(`   警告（黄）: ${warningCount}件`)
    console.log(`   情報（青）: ${infoCount}件`)

    console.log("\n💡 確認方法:")
    console.log("   1. http://localhost:3000 にアクセス")
    console.log("   2. admin@clinic.jp / password123 でログイン")
    console.log("   3. 画面上部にアラートバナーが表示されます")
    console.log("   4. 「通知センター」メニューで全通知を確認できます")
  } catch (error) {
    console.error("❌ エラーが発生しました:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await client.end()
  })
