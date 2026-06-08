const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'), sqlite3.OPEN_READONLY);

const tables = [
  'User',
  'Article',
  'Documentation',
  'Operation',
  'OtpCode',
  'AuditLog',
  'AuthEvent',
  'AuthorizationEvent'
];

async function migrate() {
  console.log('Starting migration from SQLite to PostgreSQL...');

  try {
    for (const table of tables) {
      console.log(`Migrating table: ${table}...`);
      
      const rows = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM "${table}"`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (rows.length === 0) {
        console.log(`- ${table} has 0 rows. Skipping.`);
        continue;
      }

      // SQLite returns booleans as 1/0, but Prisma expects true/false
      // SQLite returns dates as strings/numbers, Prisma expects ISO strings/Date objects
      const formattedRows = rows.map(row => {
        const formatted = { ...row };
        
        // Convert integer booleans to true/false
        for (const key in formatted) {
          // Identify boolean columns based on Prisma schema knowledge
          if (table === 'Article' && key === 'isDraft') formatted[key] = formatted[key] === 1;
          if (table === 'OtpCode' && key === 'used') formatted[key] = formatted[key] === 1;
          if (table === 'AuthorizationEvent' && key === 'allowed') formatted[key] = formatted[key] === 1;
          
          // Dates in SQLite might need to be parsed
          if (['createdAt', 'updatedAt', 'date', 'expiresAt', 'timestamp'].includes(key) && formatted[key] != null) {
            formatted[key] = new Date(formatted[key]);
          }
        }
        return formatted;
      });

      // Insert into PostgreSQL
      // We use createMany with skipDuplicates to avoid crashing if already migrated
      const modelName = table.charAt(0).toLowerCase() + table.slice(1);
      const result = await prisma[modelName].createMany({
        data: formattedRows,
        skipDuplicates: true
      });
      console.log(`- Inserted ${result.count} rows into ${table}.`);

      // After inserting, we MUST fix the PostgreSQL auto-increment sequence!
      // Otherwise, new inserts will fail with duplicate key violation.
      await prisma.$executeRawUnsafe(`SELECT setval('"${table}_id_seq"', COALESCE((SELECT MAX(id)+1 FROM "${table}"), 1), false);`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

migrate();
