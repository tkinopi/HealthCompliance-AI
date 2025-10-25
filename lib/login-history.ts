import { db } from "./db"
import { loginHistory } from "@/db/schema"

export interface LoginHistoryParams {
  userId: string
  email: string
  success: boolean
  ipAddress?: string
  userAgent?: string
  failureReason?: string
  twoFactorUsed?: boolean
}

/**
 * ログイン履歴を記録
 */
export async function recordLoginHistory(params: LoginHistoryParams): Promise<void> {
  await db.insert(loginHistory).values({
    userId: params.userId,
    email: params.email,
    success: params.success,
    ipAddress: params.ipAddress || null,
    userAgent: params.userAgent || null,
    failureReason: params.failureReason || null,
    twoFactorUsed: params.twoFactorUsed || false,
    createdAt: new Date(),
  })
}

/**
 * ユーザーのログイン履歴を取得
 */
export async function getUserLoginHistory(userId: string, limit: number = 50) {
  return await db.query.loginHistory.findMany({
    where: (loginHistory, { eq }) => eq(loginHistory.userId, userId),
    orderBy: (loginHistory, { desc }) => [desc(loginHistory.createdAt)],
    limit,
  })
}
