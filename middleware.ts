import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // 管理者専用ルート
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // コンプライアンス担当者以上のアクセス権限
    if (path.startsWith("/compliance")) {
      const authorizedRoles = ["ADMIN", "COMPLIANCE_OFFICER"]
      if (!authorizedRoles.includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
)

// 認証が必要なパス
export const config = {
  matcher: [
    /*
     * 以下のパス以外のすべてのパスに認証を要求
     * - api (APIルート)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - login (ログインページ)
     * - public フォルダ
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|public).*)",
  ],
}
