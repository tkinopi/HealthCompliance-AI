import { db, client } from "@/lib/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * 特定のユーザーの2FAを無効化するスクリプト
 * 使用方法: npx tsx scripts/disable-2fa.ts
 */
async function main() {
  const email = "admin@clinic.jp" // 2FAを無効化するユーザーのメールアドレス

  console.log(`🔓 ${email} の2段階認証を無効化しています...`)

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      console.error(`❌ ユーザーが見つかりません: ${email}`)
      process.exit(1)
    }

    console.log(`✓ ユーザーを見つけました: ${user.name} (${user.email})`)
    console.log(`  現在の2FA状態: ${user.twoFactorEnabled ? "有効" : "無効"}`)

    if (!user.twoFactorEnabled) {
      console.log(`ℹ️  このユーザーは既に2FAが無効になっています`)
      return
    }

    // 2FAを無効化
    await db
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    console.log(`✅ ${email} の2段階認証を無効化しました`)
    console.log(``)
    console.log(`次の手順:`)
    console.log(`1. ブラウザでログインページを再読み込み`)
    console.log(`2. ${email} / password123 でログイン`)
    console.log(`3. 必要に応じて設定画面から2FAを再度有効化`)
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
