import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    // テーブル一覧を取得
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('Existing tables:');
    tables.forEach(t => console.log(`- ${t.table_name}`));
    
    // drizzle_migrationsテーブルの確認
    const hasMigrations = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'drizzle_migrations'
      )
    `;
    
    console.log('\nDrizzle migrations table exists:', hasMigrations[0].exists);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkDatabase();