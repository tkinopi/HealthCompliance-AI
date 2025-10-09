// src/lib/db.ts
import "dotenv/config" 
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@/db/schema"

const connectionString = process.env.DATABASE_URL!
if (!connectionString) throw new Error("DATABASE_URL が未設定です")

// Supabase pooler(6543) 向け設定
const sql = postgres(connectionString, {
  ssl: "require",           // ← これ必須（DSNだけだと効かないことがある）
  prepare: false,           // ← pgBouncer(transaction)での prepared statement 問題を回避
  max: 5,                   // ← 接続を控えめに
  idle_timeout: 20,         // 秒
  connect_timeout: 10,      // 秒
  connection: { application_name: "seed" },
})

export const db = drizzle(sql, { schema })

// seed.ts の finally でそのまま使えるようにラップ
export const client = {
  end: () => sql.end({ timeout: 5 }),
}
