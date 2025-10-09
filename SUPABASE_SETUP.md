# Supabaseセットアップガイド

## 📝 手順

### ステップ 1: Supabaseプロジェクトの作成

1. **Supabaseにアクセス**
   - https://supabase.com にアクセス
   - GitHubアカウントでサインアップ/ログイン

2. **新規プロジェクトを作成**
   - 「New Project」をクリック
   - 以下の情報を入力：
     - **Name**: `healthcompliance-ai`
     - **Database Password**: 強力なパスワード（必ずメモ！）
     - **Region**: `Northeast Asia (Tokyo)` を選択
   - 「Create new project」をクリック
   - プロジェクトの準備に1〜2分かかります

### ステップ 2: データベース接続情報の取得

1. **Settings > Database に移動**
   - 左サイドバーの「⚙️ Project Settings」をクリック
   - 「Database」セクションを選択

2. **接続文字列をコピー**

   **Connection Pooling** セクション（PgBouncer経由）:
   - 「Transaction」モードを選択
   - 接続文字列をコピー
   - 例: `postgresql://postgres.xxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

   **Connection String** セクション（直接接続）:
   - 「URI」タブを選択
   - 接続文字列をコピー
   - 例: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres`

### ステップ 3: 環境変数の設定

プロジェクトルートの `.env` ファイルを編集：

\`\`\`env
# Supabase Database - Connection Pooling (PgBouncer)
DATABASE_URL="postgresql://postgres.xxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase Database - Direct Connection (マイグレーション用)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ランダムな文字列（既に生成済み）"

# Application
NODE_ENV="development"
\`\`\`

**重要**:
- `[YOUR-PASSWORD]` をSupabaseで設定したパスワードに置き換える
- `xxxxxx` の部分を実際のプロジェクトIDに置き換える

### ステップ 4: データベースのマイグレーション

\`\`\`bash
# Prismaクライアントを生成
npx prisma generate

# マイグレーションを実行
npx prisma migrate dev --name init

# シードデータを投入
npx prisma db seed
\`\`\`

### ステップ 5: 動作確認

\`\`\`bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
# 以下のアカウントでログイン:
# - admin@clinic.jp / password123
\`\`\`

## 🔍 Supabase Studioでデータを確認

1. Supabaseダッシュボードの「Table Editor」をクリック
2. 作成されたテーブル（Organization, User, Patient, ComplianceStatus等）を確認
3. データの閲覧・編集が可能

## 📊 便利な機能

### Prisma Studio（ローカル）

\`\`\`bash
npx prisma studio
\`\`\`

ブラウザで http://localhost:5555 が開き、データベースをGUIで操作できます。

### Supabase SQL Editor

Supabaseダッシュボードの「SQL Editor」で直接SQLを実行できます：

\`\`\`sql
-- 全ユーザーを表示
SELECT * FROM "User";

-- コンプライアンス状況を確認
SELECT
  status,
  COUNT(*) as count
FROM "ComplianceStatus"
GROUP BY status;
\`\`\`

## 🚨 トラブルシューティング

### エラー: "Can't reach database server"

- `.env`ファイルの接続文字列が正しいか確認
- パスワードに特殊文字が含まれる場合はURLエンコードが必要

### エラー: "Prepared statements are not supported"

- `DATABASE_URL`に`?pgbouncer=true`が含まれているか確認
- マイグレーション実行時は`DIRECT_URL`が使用されます

### 接続が遅い

- Supabaseの無料プランでは接続が停止する場合があります
- しばらく待ってから再試行してください

## 💡 本番環境デプロイ時

Vercel等にデプロイする場合、環境変数を設定：

\`\`\`
DATABASE_URL=接続プーリングURL
DIRECT_URL=直接接続URL
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=本番用の秘密鍵
\`\`\`

## 📚 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
