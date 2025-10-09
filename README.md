# HealthCompliance AI

日本の中小医療機関向けコンプライアンス管理システム

## 概要

HealthCompliance AIは、医療機関の日々のコンプライアンス業務を効率化し、法規制の遵守状況を一元管理するためのシステムです。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **認証**: NextAuth.js（2段階認証対応）

## 主な機能

### 現在実装済み

- ✅ ログイン機能（2段階認証対応）
- ✅ ダッシュボード（コンプライアンス状況の可視化）
- ✅ 設定ページ（プロフィール、医療機関情報、セキュリティ、通知）
- ✅ レスポンシブデザイン

### データモデル

- **Organization**: 医療機関情報
- **User**: スタッフ情報（医師、看護師、薬剤師等）
- **Patient**: 患者基本情報
- **PatientRecord**: 患者記録（カルテ）
- **ComplianceStatus**: コンプライアンス管理

## セットアップ手順

### クイックスタート（推奨: Supabase使用）

**Supabaseを使用する場合**（推奨 - 無料、セットアップ簡単）：

詳細な手順は **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** を参照してください。

1. Supabaseでプロジェクト作成（1-2分）
2. 接続文字列を`.env`にコピー
3. マイグレーション実行：`npx prisma migrate dev --name init`
4. シードデータ投入：`npx prisma db seed`
5. 開発サーバー起動：`npm run dev`

### ローカルPostgreSQLを使用する場合

<details>
<summary>クリックして展開</summary>

#### 1. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成：

\`\`\`bash
cp .env.example .env
\`\`\`

`.env`ファイルを編集し、以下の環境変数を設定：

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/healthcompliance?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/healthcompliance?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
\`\`\`

#### 2. データベースのセットアップ

PostgreSQLデータベースを作成：

\`\`\`bash
createdb healthcompliance
\`\`\`

Prismaマイグレーションを実行：

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

</details>

### 3. 開発サーバーの起動

依存関係のインストール（既に完了している場合はスキップ）：

\`\`\`bash
npm install
\`\`\`

開発サーバーの起動：

\`\`\`bash
npm run dev
\`\`\`

ブラウザで http://localhost:3000 を開いてアクセス

## プロジェクト構造

\`\`\`
HealthCompliance-AI/
├── app/                      # Next.js App Router
│   ├── api/                  # APIルート
│   │   └── auth/            # NextAuth.js認証API
│   ├── dashboard/           # ダッシュボード
│   ├── login/               # ログインページ
│   ├── settings/            # 設定ページ
│   ├── globals.css          # グローバルスタイル
│   ├── layout.tsx           # ルートレイアウト
│   └── page.tsx             # ホームページ
├── components/              # 再利用可能なコンポーネント
│   ├── ui/                  # shadcn/uiコンポーネント
│   └── dashboard-nav.tsx    # ダッシュボードナビゲーション
├── lib/                     # ユーティリティ関数
│   ├── auth.ts              # NextAuth.js設定
│   ├── prisma.ts            # Prismaクライアント
│   └── utils.ts             # ヘルパー関数
├── prisma/                  # Prismaスキーマ
│   └── schema.prisma        # データベーススキーマ
└── types/                   # TypeScript型定義
    └── next-auth.d.ts       # NextAuth型拡張
\`\`\`

## データベーススキーマ

### Organization（医療機関）
- 医療機関名、種別、住所、電話番号
- 管理者名、医療機関番号

### User（スタッフ）
- メールアドレス、名前、役職、所属部署
- 医療従事者資格番号
- 2段階認証設定

### Patient（患者）
- 患者番号、氏名、性別、生年月日
- 連絡先、血液型、アレルギー情報
- 既往歴

### ComplianceStatus（コンプライアンス）
- カテゴリー（医療法、個人情報保護法、感染症対策等）
- ステータス（未対応、対応中、完了、期限超過等）
- 優先度（低、中、高、緊急）

## スクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm start` - プロダクションサーバー起動
- `npm run lint` - ESLintチェック

## Prismaコマンド

- `npx prisma generate` - Prismaクライアント生成
- `npx prisma migrate dev` - マイグレーション作成・実行
- `npx prisma studio` - データベースGUI起動
- `npx prisma db seed` - シードデータ投入

## セキュリティ機能

- パスワードハッシュ化（bcryptjs）
- 2段階認証対応（TOTP）
- セッション管理（JWT）
- ロールベースアクセス制御（RBAC）

## デザインコンセプト

医療機関らしい落ち着いたデザイン：
- 青を基調とした配色（信頼感と清潔感）
- 日本語フォント（Noto Sans JP）
- モバイルレスポンシブ対応
- アクセシビリティ配慮

## 今後の開発予定

- [ ] コンプライアンス項目の作成・編集機能
- [ ] 患者管理機能の実装
- [ ] レポート生成機能
- [ ] ファイルアップロード（証跡管理）
- [ ] 活動ログ表示
- [ ] メール通知機能
- [ ] データエクスポート機能

## ライセンス

This project is private and proprietary.

## お問い合わせ

プロジェクトに関するご質問は、開発チームまでお問い合わせください。
