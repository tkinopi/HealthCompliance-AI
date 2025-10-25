import { LoginForm } from "@/components/auth/login-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  // 既にログインしている場合はダッシュボードにリダイレクト
  if (session) {
    redirect("/dashboard")
  }

  return <LoginForm />
}
