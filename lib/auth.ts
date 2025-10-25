import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "./db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verifyTOTP } from "./totp"
import { checkLoginAttempts, recordFailedLogin, resetLoginAttempts } from "./login-attempts"
import { recordLoginHistory } from "./login-history"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30分でセッションタイムアウト
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
        ipAddress: { label: "IP Address", type: "text" },
        userAgent: { label: "User Agent", type: "text" },
      },
      async authorize(credentials) {
        console.log("🔐 [AUTH] authorize 開始", { email: credentials?.email })

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ [AUTH] メールアドレスまたはパスワードが未入力")
          throw new Error("メールアドレスとパスワードを入力してください")
        }

        const ipAddress = credentials.ipAddress || "unknown"
        const userAgent = credentials.userAgent || "unknown"
        console.log("📍 [AUTH] IPアドレスとUserAgent取得", { ipAddress, userAgent })

        // ログイン試行回数をチェック
        console.log("🔒 [AUTH] ログイン試行回数チェック開始")
        const lockedMinutes = await checkLoginAttempts(credentials.email, ipAddress)
        if (lockedMinutes !== null) {
          console.log("⛔ [AUTH] アカウントがロックされています", { lockedMinutes })
          throw new Error(
            `ログイン試行回数が上限に達しました。${lockedMinutes}分後に再試行してください。`
          )
        }
        console.log("✅ [AUTH] ログイン試行回数チェック完了（ロックなし）")

        console.log("👤 [AUTH] ユーザー検索開始", { email: credentials.email })
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1)

        console.log("👤 [AUTH] ユーザー検索結果", {
          found: !!user,
          userId: user?.id,
          active: user?.active,
          twoFactorEnabled: user?.twoFactorEnabled
        })

        // 組織情報を別途取得（簡略化のため、ここではスキップ）
        // 必要に応じて organizations テーブルをjoinで取得
        const userWithOrg = user ? { ...user, organization: null } : null

        if (!userWithOrg || !userWithOrg.active) {
          console.log("❌ [AUTH] ユーザーが見つからないか無効化されています")
          // ログイン失敗を記録
          await recordFailedLogin(credentials.email, ipAddress)
          if (userWithOrg?.id) {
            await recordLoginHistory({
              userId: userWithOrg.id,
              email: credentials.email,
              success: false,
              ipAddress,
              userAgent,
              failureReason: "ユーザーが見つからないか、無効化されています",
            })
          }
          throw new Error("メールアドレスまたはパスワードが正しくありません")
        }

        console.log("🔑 [AUTH] パスワード検証開始")
        const isPasswordValid = await compare(
          credentials.password,
          userWithOrg.password
        )
        console.log("🔑 [AUTH] パスワード検証結果", { isPasswordValid })

        if (!isPasswordValid) {
          console.log("❌ [AUTH] パスワードが正しくありません")
          // ログイン失敗を記録
          const failureResult = await recordFailedLogin(credentials.email, ipAddress)
          await recordLoginHistory({
            userId: userWithOrg.id,
            email: credentials.email,
            success: false,
            ipAddress,
            userAgent,
            failureReason: "パスワードが正しくありません",
          })

          if (failureResult.locked) {
            throw new Error(
              `パスワードが正しくありません。ログイン試行回数が上限に達したため、${failureResult.remainingMinutes}分間ロックされました。`
            )
          }

          throw new Error("メールアドレスまたはパスワードが正しくありません")
        }

        // 2段階認証が有効な場合
        console.log("🔐 [AUTH] 2段階認証チェック", {
          twoFactorEnabled: userWithOrg.twoFactorEnabled,
          hasSecret: !!userWithOrg.twoFactorSecret,
          hasTotpCode: !!credentials.totpCode
        })

        if (userWithOrg.twoFactorEnabled && userWithOrg.twoFactorSecret) {
          if (!credentials.totpCode) {
            console.log("❌ [AUTH] 2段階認証コードが未入力")
            throw new Error("2段階認証コードを入力してください")
          }

          console.log("🔐 [AUTH] TOTP検証開始", {
            totpCode: credentials.totpCode,
            totpCodeLength: credentials.totpCode?.length,
            hasSecret: !!userWithOrg.twoFactorSecret
          })
          const isValidTotp = verifyTOTP(userWithOrg.twoFactorSecret, credentials.totpCode)
          console.log("🔐 [AUTH] TOTP検証結果", {
            isValidTotp,
            totpCode: credentials.totpCode
          })

          if (!isValidTotp) {
            console.log("❌ [AUTH] 2段階認証コードが正しくありません")
            // ログイン失敗を記録
            await recordFailedLogin(credentials.email, ipAddress)
            await recordLoginHistory({
              userId: userWithOrg.id,
              email: credentials.email,
              success: false,
              ipAddress,
              userAgent,
              failureReason: "2段階認証コードが正しくありません",
              twoFactorUsed: true,
            })
            throw new Error("2段階認証コードが正しくありません")
          }
        }

        // ログイン成功
        console.log("✅ [AUTH] ログイン成功 - 試行回数リセット開始")
        await resetLoginAttempts(credentials.email, ipAddress)

        // 最終ログイン時刻を更新
        console.log("📝 [AUTH] 最終ログイン時刻を更新")
        await db
          .update(users)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, userWithOrg.id))

        // ログイン履歴を記録
        console.log("📝 [AUTH] ログイン履歴を記録")
        await recordLoginHistory({
          userId: userWithOrg.id,
          email: credentials.email,
          success: true,
          ipAddress,
          userAgent,
          twoFactorUsed: userWithOrg.twoFactorEnabled,
        })

        const returnUser = {
          id: userWithOrg.id,
          email: userWithOrg.email,
          name: userWithOrg.name,
          role: userWithOrg.role,
          organizationId: userWithOrg.organizationId,
          organization: userWithOrg.organization,
        }

        console.log("✅ [AUTH] 認証完了 - ユーザーオブジェクトを返却", {
          id: returnUser.id,
          email: returnUser.email,
          role: returnUser.role
        })

        return returnUser
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("🎫 [JWT] コールバック開始", { hasUser: !!user })
      if (user) {
        console.log("🎫 [JWT] ユーザー情報をトークンに追加", {
          id: user.id,
          role: user.role,
          organizationId: user.organizationId
        })
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
      }
      console.log("🎫 [JWT] トークンを返却")
      return token
    },
    async session({ session, token }) {
      console.log("🔑 [SESSION] コールバック開始")
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        console.log("🔑 [SESSION] セッションにユーザー情報を追加", {
          id: session.user.id,
          role: session.user.role
        })
      }
      console.log("🔑 [SESSION] セッションを返却")
      return session
    },
  },
}
