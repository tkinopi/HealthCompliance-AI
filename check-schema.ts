import { db, client } from "./lib/db"
import { sql } from "drizzle-orm"

async function checkSchema() {
  try {
    console.log("📊 データベーススキーマを確認中...")

    // テーブル一覧を取得
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `)

    console.log("\n✅ 現在のテーブル:")
    if (tables.rows.length === 0) {
      console.log("  テーブルがありません（空のデータベース）")
    } else {
      tables.rows.forEach((row: any) => {
        console.log(`  - ${row.table_name}`)
      })
    }

    console.log(`\n📈 テーブル数: ${tables.rows.length}`)

  } catch (error) {
    console.error("❌ エラーが発生しました:", error)
  } finally {
    await client.end()
  }
}

checkSchema()
