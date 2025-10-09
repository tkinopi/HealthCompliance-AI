import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "./db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
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
        totpCode: { label: "2FA Code", type: "text", optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください")
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
          with: {
            organization: true,
          },
        })

        if (!user || !user.active) {
          throw new Error("ユーザーが見つからないか、無効化されています")
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("パスワードが正しくありません")
        }

        // 2段階認証が有効な場合
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.totpCode) {
            throw new Error("2段階認証コードを入力してください")
          }

          // TOTPコードの検証（実装は別途必要）
          // const isValidTotp = verifyTOTP(user.twoFactorSecret, credentials.totpCode)
          // if (!isValidTotp) {
          //   throw new Error("2段階認証コードが正しくありません")
          // }
        }

        // 最終ログイン時刻を更新
        await db
          .update(users)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id))

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
      }
      return session
    },
  },
}
