const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'prisma/dev.db'), sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      throw err;
    }
    console.log("Tables:");
    tables.forEach((table) => {
      console.log(table.name);
      db.all(`SELECT COUNT(*) as count FROM "${table.name}"`, [], (err, rows) => {
          console.log(`- ${table.name}: ${rows[0].count} rows`);
      });
    });
  });
});
