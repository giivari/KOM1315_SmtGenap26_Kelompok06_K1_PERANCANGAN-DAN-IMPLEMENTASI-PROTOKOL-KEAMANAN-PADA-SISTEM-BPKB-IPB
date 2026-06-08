const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'), sqlite3.OPEN_READONLY);

function queryAll(query) {
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function parseRow(row, table) {
  const formatted = { ...row };
  for (const key in formatted) {
    if (table === 'AuthorizationEvent' && key === 'allowed') formatted[key] = formatted[key] === 1;
    if (['createdAt', 'updatedAt', 'date', 'expiresAt', 'timestamp'].includes(key) && formatted[key] != null) {
      formatted[key] = new Date(formatted[key]);
    }
  }
  return formatted;
}

async function migrateRemaining() {
  console.log('Migrating remaining logs with createMany...');
  try {
    // 1. Re-build User ID map
    const idMaps = { User: {} };
    const sqUsers = await queryAll('SELECT * FROM "User"');
    for (const sqUser of sqUsers) {
      const pgUser = await prisma.user.findUnique({ where: { email: sqUser.email } });
      if (pgUser) {
        idMaps.User[sqUser.id] = pgUser.id;
      }
    }

    // 2. Migrate AuthEvent
    console.log('Migrating AuthEvent...');
    const authEvents = await queryAll('SELECT * FROM "AuthEvent"');
    const authEventData = [];
    for (const row of authEvents) {
      const parsed = parseRow(row, 'AuthEvent');
      if (parsed.userId) parsed.userId = idMaps.User[parsed.userId];
      delete parsed.id;
      authEventData.push(parsed);
    }
    // Delete existing to avoid dupes if it partially failed?
    // The previous script failed on AuthEvent. Let's just wipe AuthEvent and re-insert to be safe.
    await prisma.authEvent.deleteMany({});
    if (authEventData.length > 0) {
        await prisma.authEvent.createMany({ data: authEventData });
        console.log(`-> Inserted ${authEventData.length} AuthEvents`);
    }

    // 3. Migrate AuthorizationEvent
    console.log('Migrating AuthorizationEvent...');
    const authzEvents = await queryAll('SELECT * FROM "AuthorizationEvent"');
    const authzEventData = [];
    for (const row of authzEvents) {
      const parsed = parseRow(row, 'AuthorizationEvent');
      if (parsed.userId) parsed.userId = idMaps.User[parsed.userId];
      delete parsed.id;
      authzEventData.push(parsed);
    }
    // Delete existing to avoid dupes
    await prisma.authorizationEvent.deleteMany({});
    if (authzEventData.length > 0) {
        await prisma.authorizationEvent.createMany({ data: authzEventData });
        console.log(`-> Inserted ${authzEventData.length} AuthorizationEvents`);
    }

    console.log('Finished migrating remaining logs!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

migrateRemaining();
