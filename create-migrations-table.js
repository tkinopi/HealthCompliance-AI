import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function createMigrationsTable() {
  try {
    // マイグレーション履歴テーブルを作成
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamp DEFAULT now()
      )
    `;
    
    console.log('✅ Migrations table created successfully');
    
    // 既存のスキーマを初期マイグレーションとして記録
    await sql`
      INSERT INTO drizzle_migrations (hash) 
      VALUES ('initial_schema')
      ON CONFLICT DO NOTHING
    `;
    
    console.log('✅ Initial migration recorded');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

createMigrationsTable();