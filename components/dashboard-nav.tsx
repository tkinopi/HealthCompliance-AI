"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Activity,
  LogOut,
  Building2,
} from "lucide-react"

interface DashboardNavProps {
  session: any
}

const navItems = [
  {
    title: "ダッシュボード",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "コンプライアンス",
    href: "/dashboard/compliance",
    icon: FileText,
  },
  {
    title: "患者管理",
    href: "/dashboard/patients",
    icon: Users,
  },
  {
    title: "活動ログ",
    href: "/dashboard/activity",
    icon: Activity,
  },
  {
    title: "設定",
    href: "/settings",
    icon: Settings,
  },
]

export default function DashboardNav({ session }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-blue-900">
                HealthCompliance AI
              </span>
            </Link>

            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500">{session.user.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
