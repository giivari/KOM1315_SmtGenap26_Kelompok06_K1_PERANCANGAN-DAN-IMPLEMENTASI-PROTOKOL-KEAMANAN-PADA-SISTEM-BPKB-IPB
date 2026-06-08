const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  const articles = await prisma.article.findMany();
  const docs = await prisma.documentation.findMany();
  console.log(`Users in Postgres: ${users.length} (IDs: ${users.map(u => u.id).join(', ')})`);
  console.log(`Articles in Postgres: ${articles.length} (IDs: ${articles.map(a => a.id).join(', ')})`);
  console.log(`Docs in Postgres: ${docs.length} (IDs: ${docs.map(d => d.id).join(', ')})`);
  await prisma.$disconnect();
}
check();
