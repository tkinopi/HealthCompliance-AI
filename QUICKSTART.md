# クイックスタートガイド

## 🚀 初回セットアップ（5分で完了）

### オプション A: Supabase使用（推奨 - 最も簡単）

詳細は **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** を参照

1. **Supabaseプロジェクト作成**
   - https://supabase.com でプロジェクト作成
   - リージョンは「Northeast Asia (Tokyo)」を選択

2. **環境変数の設定**
   - Supabaseから接続文字列をコピー
   - `.env`ファイルに貼り付け

3. **マイグレーションとシード**
   \`\`\`bash
   npx prisma migrate dev --name init
   npx prisma db seed
   npm run dev
   \`\`\`

### オプション B: ローカルPostgreSQL使用

<details>
<summary>クリックして展開</summary>

#### 1. 環境変数の設定

`.env`ファイルを作成：

\`\`\`bash
cp .env.example .env
\`\`\`

`.env`ファイルを編集し、データベース接続情報を設定してください。

#### 2. データベースのセットアップ

PostgreSQLがインストールされていることを確認してください。

データベースを作成：

\`\`\`bash
createdb healthcompliance
\`\`\`

または、PostgreSQLコマンドラインで：

\`\`\`sql
CREATE DATABASE healthcompliance;
\`\`\`

</details>

### 3. マイグレーション実行

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

### 4. シードデータ投入

テスト用のデータを投入：

\`\`\`bash
npx prisma db seed
\`\`\`

以下のテストユーザーが作成されます：
- 管理者: `admin@clinic.jp` / `password123`
- 医師: `doctor@clinic.jp` / `password123`
- 看護師: `nurse@clinic.jp` / `password123`

### 5. 開発サーバー起動

\`\`\`bash
npm run dev
\`\`\`

### 6. ログイン

ブラウザで http://localhost:3000 にアクセスし、以下のアカウントでログインしてください：

**メールアドレス**: `admin@clinic.jp`
**パスワード**: `password123`

## よくある問題

### データベース接続エラー

`.env`ファイルの`DATABASE_URL`が正しいか確認してください：

\`\`\`env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/healthcompliance?schema=public"
\`\`\`

### Prismaクライアントが見つからない

以下のコマンドを実行してください：

\`\`\`bash
npx prisma generate
\`\`\`

### ポート3000が既に使用されている

別のポートで起動する場合：

\`\`\`bash
npm run dev -- -p 3001
\`\`\`

## Prisma Studio（データベースGUI）

データベースの内容を確認・編集するには：

\`\`\`bash
npx prisma studio
\`\`\`

ブラウザで http://localhost:5555 が開きます。

## 主要なページ

- ログイン: http://localhost:3000/login
- ダッシュボード: http://localhost:3000/dashboard
- 設定: http://localhost:3000/settings

## 開発の流れ

1. データベーススキーマの変更: `prisma/schema.prisma`を編集
2. マイグレーション作成: `npx prisma migrate dev --name 変更内容`
3. Prismaクライアント再生成: 自動実行されます
4. 型定義を使用してコード実装

## トラブルシューティング

問題が発生した場合は、以下を試してください：

\`\`\`bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# Prismaクライアントの再生成
npx prisma generate

# データベースのリセット（データが削除されます）
npx prisma migrate reset
\`\`\`

## サポート

その他の質問は`README.md`を参照するか、開発チームにお問い合わせください。
