# HealthCompliance AI

日本の中小医療機関向けコンプライアンス管理システム

## 概要

HealthCompliance AIは、医療機関の日々のコンプライアンス業務を効率化し、法規制の遵守状況を一元管理するためのシステムです。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **データベース**: PostgreSQL
- **ORM**: Drizzle ORM
- **認証**: NextAuth.js v4（2段階認証対応）
- **2FA**: speakeasy（TOTP）+ QRCode生成

## 主な機能

### 現在実装済み

- ✅ **安全な認証システム**
  - メールアドレス + パスワード認証
  - 2段階認証（TOTP）必須対応
  - QRコード生成による簡単な2FA設定
  - ログイン試行回数制限（5回失敗で30分ロック）
  - セッション管理（30分自動ログアウト）
  - ログイン履歴の記録（医療情報システムのため必須）
- ✅ **ロールベースアクセス制御（RBAC）**
  - 管理者、医師、看護師、薬剤師、コンプライアンス担当、一般スタッフ
  - 権限に応じたページアクセス制御
- ✅ **セキュリティ機能**
  - bcryptによるパスワードハッシュ化
  - JWTトークン管理
  - ミドルウェアによる認証チェック
  - IPアドレス・UserAgentの記録

### データモデル

- **Organization**: 医療機関情報
- **User**: スタッフ情報（医師、看護師、薬剤師等）
- **Account**: NextAuth OAuth アカウント情報
- **Session**: セッション管理
- **LoginHistory**: ログイン履歴（医療情報システムのため必須）
- **LoginAttempt**: ログイン試行回数制限
- **Patient**: 患者基本情報
- **PatientRecord**: 患者記録（カルテ）
- **ComplianceStatus**: コンプライアンス管理

## セットアップ手順

### クイックスタート（推奨: Supabase使用）

**Supabaseを使用する場合**（推奨 - 無料、セットアップ簡単）：

詳細な手順は **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** を参照してください。

1. Supabaseでプロジェクト作成（1-2分）
2. 接続文字列を`.env`にコピー
3. パッケージインストール：`npm install`
4. マイグレーション実行：`npm run db:push`
5. シードデータ投入：`npm run db:seed`
6. 開発サーバー起動：`npm run dev`

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

Drizzleマイグレーションを実行：

\`\`\`bash
npm run db:push
\`\`\`

シードデータを投入：

\`\`\`bash
npm run db:seed
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

## Drizzle ORM コマンド

- `npm run db:generate` - マイグレーションファイル生成
- `npm run db:migrate` - マイグレーション実行
- `npm run db:push` - スキーマをDBに直接反映（開発用）
- `npm run db:studio` - Drizzle Studio（データベースGUI）起動
- `npm run db:seed` - シードデータ投入

## 認証・セキュリティ機能の詳細

### 認証フロー

1. **ログイン画面** (`/login`)
   - メールアドレスとパスワードを入力
   - ログイン試行回数制限チェック（5回失敗で30分ロック）
   - パスワード検証（bcrypt）

2. **2段階認証（2FA）**
   - 2FAが有効なユーザーは6桁のTOTPコードを入力
   - speakeasyライブラリによるTOTP検証
   - 前後2ステップ（約1分）の時間誤差を許容

3. **セッション管理**
   - JWT戦略を使用
   - 30分で自動ログアウト
   - ミドルウェアで全ページの認証チェック

4. **ログイン履歴記録**
   - すべてのログイン試行を記録（成功/失敗）
   - IPアドレス、UserAgent、失敗理由を保存
   - 医療情報システムのコンプライアンス要件に準拠

### 2段階認証の設定方法

1. ログイン後、設定画面にアクセス
2. 「2段階認証を設定する」をクリック
3. 表示されたQRコードを認証アプリでスキャン
   - Google Authenticator
   - Microsoft Authenticator
   - Authy など
4. 認証アプリに表示される6桁のコードを入力して検証
5. 2FA有効化完了

### API エンドポイント

- `POST /api/auth/2fa/setup` - 2FA設定開始（QRコード生成）
- `POST /api/auth/2fa/verify` - 2FA検証・有効化
- `POST /api/auth/2fa/disable` - 2FA無効化（パスワード確認必要）

### デモアカウント

プロジェクトには以下のデモアカウントが用意されています：

| ロール | メールアドレス | パスワード | 説明 |
|--------|---------------|-----------|------|
| 管理者 | admin@clinic.jp | password123 | 全機能へのアクセス権限 |
| 医師 | doctor@clinic.jp | password123 | 医療記録の作成・編集 |
| 看護師 | nurse@clinic.jp | password123 | 患者ケア記録 |
| コンプライアンス担当 | compliance@clinic.jp | password123 | コンプライアンス管理 |
| 一般スタッフ | staff@clinic.jp | password123 | 基本機能のみ |

**セキュリティ設定:**
- ログイン試行回数制限: 5回失敗で30分ロック
- セッションタイムアウト: 30分
- 2段階認証: 初期状態では無効（各自で設定可能）

### ロールと権限

- **ADMIN**: すべての機能にアクセス可能
- **DOCTOR**: 患者記録の作成・編集
- **NURSE**: 患者ケア記録
- **PHARMACIST**: 処方箋管理
- **COMPLIANCE_OFFICER**: コンプライアンス管理機能
- **STAFF**: 基本機能のみ

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
