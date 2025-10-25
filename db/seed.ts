import { db, client } from "@/lib/db"
import { organizations, users, patients, complianceStatuses } from "./schema"
import { hash } from "bcryptjs"
import { eq } from "drizzle-orm"

async function main() {
  console.log("🌱 シードデータを投入しています...")

  try {
    // 医療機関を作成
    const [organization] = await db
      .insert(organizations)
      .values({
        name: "医療法人さくらクリニック",
        type: "診療所",
        address: "東京都港区六本木1-2-3 さくらビル2F",
        phoneNumber: "03-1234-5678",
        directorName: "山田 太郎",
        licenseNumber: "1234567890",
      })
      .onConflictDoUpdate({
        target: organizations.licenseNumber,
        set: { updatedAt: new Date() },
      })
      .returning()

    console.log("✅ 医療機関を作成しました:", organization.name)

    // 管理者ユーザーを作成
    const hashedPassword = await hash("password123", 12)

    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@clinic.jp",
        name: "山田 太郎",
        password: hashedPassword,
        role: "ADMIN",
        department: "管理部",
        position: "院長",
        licenseNumber: "MD123456",
        phoneNumber: "090-1234-5678",
        organizationId: organization.id,
        twoFactorEnabled: false,
        active: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { updatedAt: new Date() },
      })
      .returning()

    console.log("✅ 管理者ユーザーを作成しました:", adminUser.email)

    // 医師ユーザーを作成
    const [doctorUser] = await db
      .insert(users)
      .values({
        email: "doctor@clinic.jp",
        name: "佐藤 花子",
        password: hashedPassword,
        role: "DOCTOR",
        department: "内科",
        position: "医師",
        licenseNumber: "MD789012",
        phoneNumber: "090-2345-6789",
        organizationId: organization.id,
        twoFactorEnabled: false,
        active: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { updatedAt: new Date() },
      })
      .returning()

    console.log("✅ 医師ユーザーを作成しました:", doctorUser.email)

    // 看護師ユーザーを作成
    const [nurseUser] = await db
      .insert(users)
      .values({
        email: "nurse@clinic.jp",
        name: "鈴木 美咲",
        password: hashedPassword,
        role: "NURSE",
        department: "看護部",
        position: "看護師",
        licenseNumber: "RN345678",
        phoneNumber: "090-3456-7890",
        organizationId: organization.id,
        twoFactorEnabled: false,
        active: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { updatedAt: new Date() },
      })
      .returning()

    console.log("✅ 看護師ユーザーを作成しました:", nurseUser.email)

    // コンプライアンス担当者を作成
    const [complianceUser] = await db
      .insert(users)
      .values({
        email: "compliance@clinic.jp",
        name: "田中 次郎",
        password: hashedPassword,
        role: "COMPLIANCE_OFFICER",
        department: "管理部",
        position: "コンプライアンス担当",
        phoneNumber: "090-4567-8901",
        organizationId: organization.id,
        twoFactorEnabled: false,
        active: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { updatedAt: new Date() },
      })
      .returning()

    console.log("✅ コンプライアンス担当者を作成しました:", complianceUser.email)

    // 一般スタッフを作成
    const [staffUser] = await db
      .insert(users)
      .values({
        email: "staff@clinic.jp",
        name: "高橋 優子",
        password: hashedPassword,
        role: "STAFF",
        department: "受付",
        position: "事務員",
        phoneNumber: "090-5678-9012",
        organizationId: organization.id,
        twoFactorEnabled: false,
        active: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { updatedAt: new Date() },
      })
      .returning()

    console.log("✅ 一般スタッフを作成しました:", staffUser.email)

    // コンプライアンス項目を作成
    const complianceItems = [
      {
        category: "MEDICAL_LAW",
        title: "医療法施行規則の確認",
        description: "最新の医療法施行規則に準拠しているか確認する",
        status: "COMPLETED",
        priority: "HIGH",
        dueDate: new Date("2024-12-31"),
        completedDate: new Date("2024-10-01"),
        assignedToId: adminUser.id,
        organizationId: organization.id,
      },
      {
        category: "PERSONAL_INFO",
        title: "個人情報保護方針の更新",
        description: "個人情報保護方針を最新の法令に合わせて更新",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date("2024-11-30"),
        assignedToId: adminUser.id,
        organizationId: organization.id,
      },
      {
        category: "INFECTION_CONTROL",
        title: "感染症対策マニュアルの見直し",
        description: "最新のガイドラインに基づき感染症対策マニュアルを見直す",
        status: "PENDING",
        priority: "MEDIUM",
        dueDate: new Date("2024-12-15"),
        assignedToId: doctorUser.id,
        organizationId: organization.id,
      },
      {
        category: "STAFF_TRAINING",
        title: "スタッフ研修の実施",
        description: "個人情報保護に関するスタッフ研修を実施",
        status: "PENDING",
        priority: "MEDIUM",
        dueDate: new Date("2024-11-15"),
        assignedToId: nurseUser.id,
        organizationId: organization.id,
      },
      {
        category: "FACILITY_SAFETY",
        title: "施設安全点検",
        description: "施設の安全点検を実施し、報告書を作成",
        status: "OVERDUE",
        priority: "URGENT",
        dueDate: new Date("2024-09-30"),
        assignedToId: adminUser.id,
        organizationId: organization.id,
      },
    ]

    for (const item of complianceItems) {
      await db.insert(complianceStatuses).values(item)
    }

    console.log("✅ コンプライアンス項目を作成しました")

    // 患者データを作成
    const patientData = [
      {
        patientNumber: "P0001",
        lastName: "田中",
        firstName: "一郎",
        lastNameKana: "タナカ",
        firstNameKana: "イチロウ",
        gender: "MALE",
        dateOfBirth: new Date("1980-05-15"),
        phoneNumber: "090-1111-2222",
        email: "tanaka@example.com",
        address: "東京都渋谷区1-2-3",
        bloodType: "A型",
        organizationId: organization.id,
      },
      {
        patientNumber: "P0002",
        lastName: "高橋",
        firstName: "美咲",
        lastNameKana: "タカハシ",
        firstNameKana: "ミサキ",
        gender: "FEMALE",
        dateOfBirth: new Date("1990-08-20"),
        phoneNumber: "090-3333-4444",
        address: "東京都新宿区4-5-6",
        bloodType: "B型",
        allergies: "ペニシリン",
        organizationId: organization.id,
      },
      {
        patientNumber: "P0003",
        lastName: "伊藤",
        firstName: "健太",
        lastNameKana: "イトウ",
        firstNameKana: "ケンタ",
        gender: "MALE",
        dateOfBirth: new Date("1975-03-10"),
        phoneNumber: "090-5555-6666",
        address: "東京都品川区7-8-9",
        bloodType: "O型",
        medicalHistory: "高血圧",
        organizationId: organization.id,
      },
    ]

    for (const patient of patientData) {
      await db
        .insert(patients)
        .values(patient)
        .onConflictDoUpdate({
          target: patients.patientNumber,
          set: { updatedAt: new Date() },
        })
    }

    console.log("✅ 患者データを作成しました")

    console.log("\n🎉 シードデータの投入が完了しました！")
    console.log("\n📝 ログイン情報:")
    console.log("   管理者:              admin@clinic.jp / password123")
    console.log("   医師:                doctor@clinic.jp / password123")
    console.log("   看護師:              nurse@clinic.jp / password123")
    console.log("   コンプライアンス担当: compliance@clinic.jp / password123")
    console.log("   一般スタッフ:         staff@clinic.jp / password123")
    console.log("\n🔐 セキュリティ:")
    console.log("   - 全てのアカウントにパスワード: password123")
    console.log("   - 2段階認証は初期状態では無効（各自で設定してください）")
    console.log("   - ログイン試行回数制限: 5回失敗で30分ロック")
    console.log("   - セッションタイムアウト: 30分")
  } catch (error) {
    console.error("❌ エラーが発生しました:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await client.end()
  })
