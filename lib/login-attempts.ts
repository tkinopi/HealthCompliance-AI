import { db } from "./db"
import { loginAttempts } from "@/db/schema"
import { eq, and } from "drizzle-orm"

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 30

/**
 * ログイン試行回数をチェック
 * @returns ロックされている場合は残り時間（分）、ロックされていない場合はnull
 */
export async function checkLoginAttempts(
  email: string,
  ipAddress: string
): Promise<number | null> {
  try {
    const now = new Date()

    // 既存のレコードを取得
    const [attempt] = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.ipAddress, ipAddress)
        )
      )
      .limit(1)

    if (!attempt) {
      return null // 初回ログイン試行
    }

    // ロック期間中かチェック
    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      const remainingMinutes = Math.ceil(
        (attempt.lockedUntil.getTime() - now.getTime()) / (1000 * 60)
      )
      return remainingMinutes
    }

    // ロック期間が過ぎていればリセット
    if (attempt.lockedUntil && attempt.lockedUntil <= now) {
      await db
        .update(loginAttempts)
        .set({
          attemptCount: 0,
          lockedUntil: null,
          lastAttemptAt: now,
        })
        .where(eq(loginAttempts.id, attempt.id))
      return null
    }

    return null
  } catch (error) {
    console.error("[LOGIN ATTEMPTS] テーブルアクセスエラー:", error)
    // テーブルが存在しない場合はチェックをスキップ
    return null
  }
}

/**
 * ログイン失敗を記録
 */
export async function recordFailedLogin(
  email: string,
  ipAddress: string
): Promise<{ locked: boolean; remainingMinutes?: number }> {
  try {
    const now = new Date()

    const [existingAttempt] = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.ipAddress, ipAddress)
        )
      )
      .limit(1)

    if (!existingAttempt) {
      // 新規レコード作成
      await db.insert(loginAttempts).values({
        email,
        ipAddress,
        attemptCount: 1,
        lastAttemptAt: now,
      })
      return { locked: false }
    }

    const newAttemptCount = existingAttempt.attemptCount + 1

    if (newAttemptCount >= MAX_ATTEMPTS) {
      // アカウントをロック
      const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000)
      await db
        .update(loginAttempts)
        .set({
          attemptCount: newAttemptCount,
          lastAttemptAt: now,
          lockedUntil,
        })
        .where(eq(loginAttempts.id, existingAttempt.id))

      return {
        locked: true,
        remainingMinutes: LOCK_DURATION_MINUTES,
      }
    }

    // 試行回数を増やす
    await db
      .update(loginAttempts)
      .set({
        attemptCount: newAttemptCount,
        lastAttemptAt: now,
      })
      .where(eq(loginAttempts.id, existingAttempt.id))

    return { locked: false }
  } catch (error) {
    console.error("[LOGIN ATTEMPTS] 失敗記録エラー:", error)
    // テーブルが存在しない場合は記録をスキップ
    return { locked: false }
  }
}

/**
 * ログイン成功時に試行回数をリセット
 */
export async function resetLoginAttempts(
  email: string,
  ipAddress: string
): Promise<void> {
  try {
    const [existingAttempt] = await db
      .select()
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email),
          eq(loginAttempts.ipAddress, ipAddress)
        )
      )
      .limit(1)

    if (existingAttempt) {
      await db
        .update(loginAttempts)
        .set({
          attemptCount: 0,
          lockedUntil: null,
        })
        .where(eq(loginAttempts.id, existingAttempt.id))
    }
  } catch (error) {
    console.error("[LOGIN ATTEMPTS] リセットエラー:", error)
    // テーブルが存在しない場合はリセットをスキップ
  }
}
