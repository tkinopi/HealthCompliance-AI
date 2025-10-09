import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { complianceStatuses, patients, users } from "@/db/schema"
import { eq, count, sql } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  // コンプライアンス統計を取得
  const complianceStats = await db
    .select({
      status: complianceStatuses.status,
      count: count(),
    })
    .from(complianceStatuses)
    .where(eq(complianceStatuses.organizationId, session.user.organizationId))
    .groupBy(complianceStatuses.status)

  // 患者数を取得
  const [patientCountResult] = await db
    .select({ count: count() })
    .from(patients)
    .where(
      sql`${patients.organizationId} = ${session.user.organizationId} AND ${patients.active} = true`
    )

  const patientCount = patientCountResult?.count || 0

  // スタッフ数を取得
  const [staffCountResult] = await db
    .select({ count: count() })
    .from(users)
    .where(
      sql`${users.organizationId} = ${session.user.organizationId} AND ${users.active} = true`
    )

  const staffCount = staffCountResult?.count || 0

  // 最近のコンプライアンスステータスを取得
  const recentCompliance = await db.query.complianceStatuses.findMany({
    where: eq(complianceStatuses.organizationId, session.user.organizationId),
    orderBy: (complianceStatuses, { desc }) => [desc(complianceStatuses.updatedAt)],
    limit: 5,
    with: {
      assignedTo: {
        columns: {
          name: true,
        },
      },
    },
  })

  const pendingCount = complianceStats.find((s) => s.status === "PENDING")?.count || 0
  const inProgressCount = complianceStats.find((s) => s.status === "IN_PROGRESS")?.count || 0
  const completedCount = complianceStats.find((s) => s.status === "COMPLETED")?.count || 0
  const overdueCount = complianceStats.find((s) => s.status === "OVERDUE")?.count || 0

  const totalCompliance = pendingCount + inProgressCount + completedCount + overdueCount

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600 mt-2">
          コンプライアンス状況の概要を確認できます
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              未対応項目
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {pendingCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              全体の {Math.round((Number(pendingCount) / totalCompliance) * 100 || 0)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              対応中項目
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {inProgressCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              全体の{" "}
              {Math.round((Number(inProgressCount) / totalCompliance) * 100 || 0)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              完了項目
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {completedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              全体の {Math.round((Number(completedCount) / totalCompliance) * 100 || 0)}
              %
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              期限超過
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {overdueCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">早急な対応が必要</p>
          </CardContent>
        </Card>
      </div>

      {/* その他の統計 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              登録患者数
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {patientCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">アクティブな患者</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              スタッフ数
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{staffCount}</div>
            <p className="text-xs text-gray-500 mt-1">アクティブなスタッフ</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近の活動 */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>最近のコンプライアンス活動</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCompliance.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                まだコンプライアンス項目がありません
              </p>
            ) : (
              recentCompliance.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      担当: {item.assignedTo?.name || "未割当"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={
                        item.status === "COMPLETED"
                          ? "default"
                          : item.status === "OVERDUE"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {item.status === "PENDING" && "未対応"}
                      {item.status === "IN_PROGRESS" && "対応中"}
                      {item.status === "COMPLETED" && "完了"}
                      {item.status === "OVERDUE" && "期限超過"}
                      {item.status === "REVIEW" && "レビュー中"}
                      {item.status === "APPROVED" && "承認済み"}
                    </Badge>
                    {item.priority === "URGENT" && (
                      <Badge variant="destructive">緊急</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
