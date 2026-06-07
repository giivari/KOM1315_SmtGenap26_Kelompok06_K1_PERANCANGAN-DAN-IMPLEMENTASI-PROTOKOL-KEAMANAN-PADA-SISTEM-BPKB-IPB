const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Kunci rahasia untuk AES-256 (harus sama persis dengan yang ada di env/audit/security)
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'BpkbIpbSecretKeyUntukAes256Crypt';

/**
 * Fungsi bantuan untuk mengenkripsi IP di data seed menggunakan AES-256-CBC
 */
function encryptIP(ip) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(ip, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encryptedData: encrypted, iv: iv.toString('hex') };
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.authorizationEvent.deleteMany();
  await prisma.authEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.article.deleteMany();
  await prisma.documentation.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.user.deleteMany();

  // ===== USERS =====
  const hashedPassword = await bcrypt.hash('password123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin BPKB',
      email: 'admin@bpkb-ipb.ac.id',
      password: adminPassword,
      role: 'admin',
    }
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'Jordan Vieno Simamora',
      email: 'jordan@apps.ipb.ac.id',
      password: hashedPassword,
      role: 'user',
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Hanifah Syahidah',
      email: 'hanifah@apps.ipb.ac.id',
      password: hashedPassword,
      role: 'user',
    }
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Muhammad Naufal',
      email: 'naufal@apps.ipb.ac.id',
      password: hashedPassword,
      role: 'user',
    }
  });

  console.log('✅ Users created');

  // ===== ARTICLES (from existing data) =====
  await prisma.article.createMany({
    data: [
      {
        name: 'IPB University Raih Peringkat 29 UI GreenMetric 2024',
        content: 'IPB University berhasil meraih peringkat 29 di dunia sebagai Kampus Hijau Berkelanjutan versi UI GreenMetric World University Rankings 2024. Posisi tersebut meningkat dari peringkat 34 pada tahun 2023 lalu. Prestasi ini diberikan pada UI GreenMetric World University Rankings 2024 yang dilaksanakan di Sao Paulo University, Brazil. Pencapaian ini menunjukkan komitmen IPB dalam menerapkan prinsip-prinsip kampus berkelanjutan.',
        date: new Date('2024-12-15'),
        author: 'BPKB IPB',
        isDraft: false,
      },
      {
        name: 'Program Kampus Berkelanjutan IPB 2025',
        content: 'BPKB IPB meluncurkan program baru untuk tahun 2025 yang berfokus pada pengurangan emisi karbon, pengelolaan limbah yang lebih baik, dan peningkatan efisiensi energi di seluruh kampus. Program ini melibatkan seluruh civitas akademika dalam upaya mewujudkan kampus yang ramah lingkungan.',
        date: new Date('2025-01-20'),
        author: 'BPKB IPB',
        isDraft: false,
      },
      {
        name: 'Seminar Nasional Pembangunan Berkelanjutan',
        content: 'IPB University melalui BPKB menyelenggarakan Seminar Nasional Pembangunan Berkelanjutan yang dihadiri oleh akademisi, praktisi, dan pemangku kepentingan dari seluruh Indonesia. Seminar ini membahas strategi dan implementasi SDGs dalam konteks pendidikan tinggi.',
        date: new Date('2025-02-10'),
        author: 'BPKB IPB',
        isDraft: false,
      },
      {
        name: 'IPB Town: Konsep Kota Kampus Berkelanjutan',
        content: 'Konsep IPB Town merupakan visi pengembangan kampus IPB menjadi sebuah kota kampus yang berkelanjutan. Konsep ini mencakup pengembangan infrastruktur hijau, transportasi ramah lingkungan, dan ruang terbuka yang terintegrasi dengan lingkungan sekitar.',
        date: new Date('2025-03-05'),
        author: 'BPKB IPB',
        isDraft: false,
      },
      {
        name: 'Pengelolaan Air Berkelanjutan di Kampus IPB',
        content: 'BPKB IPB mengimplementasikan sistem pengelolaan air berkelanjutan yang mencakup rain water harvesting, pengolahan air limbah, dan konservasi sumber daya air di kampus. Sistem ini telah berhasil mengurangi konsumsi air bersih sebesar 20% dari tahun sebelumnya.',
        date: new Date('2025-04-01'),
        author: 'BPKB IPB',
        isDraft: false,
      },
    ]
  });
  console.log('✅ Articles created');

  // ===== DOCUMENTATION (from existing data) =====
  await prisma.documentation.createMany({
    data: [
      {
        description: 'Seminar Nasional Kampus Berkelanjutan 2024',
        date: new Date('2024-11-15'),
      },
      {
        description: 'Penanaman Pohon di Area Kampus Dramaga',
        date: new Date('2024-10-20'),
      },
      {
        description: 'Workshop Pengelolaan Limbah Kampus',
        date: new Date('2024-09-10'),
      },
      {
        description: 'Kunjungan Delegasi UI GreenMetric',
        date: new Date('2024-08-05'),
      },
      {
        description: 'Program Solar Panel Installation Phase 2',
        date: new Date('2024-07-15'),
      },
    ]
  });
  console.log('✅ Documentation created');

  // ===== OPERATIONS (from existing data) =====
  await prisma.operation.createMany({
    data: [
      { category: 'Setting and Infrastructure', value: 1200, maxValue: 1500 },
      { category: 'Energy Conversion', value: 1100, maxValue: 1500 },
      { category: 'Water', value: 900, maxValue: 1000 },
      { category: 'Education and Research', value: 1300, maxValue: 1800 },
      { category: 'Transportation', value: 1400, maxValue: 1800 },
      { category: 'Waste', value: 1050, maxValue: 1200 },
    ]
  });
  console.log('✅ Operations created');

  // ===== SECURITY DUMMY DATA (30 days) =====
  const users = [admin, user1, user2, user3];
  const now = new Date();

  // Auth Events - simulate 30 days of activity
  const authEvents = [];
  const eventTypes = ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'OTP_SENT', 'OTP_VERIFIED', 'OTP_FAILED', 'LOGOUT', 'REGISTER'];
  const ips = ['192.168.1.100', '10.0.0.15', '172.16.0.50', '203.0.113.42', '198.51.100.10', '192.168.1.200'];
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    'Mozilla/5.0 (Linux; Android 14)',
  ];

  for (let day = 30; day >= 0; day--) {
    const date = new Date(now - day * 24 * 60 * 60 * 1000);
    
    // More events on weekdays
    const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
    const eventsPerDay = isWeekday ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 8) + 3;

    for (let i = 0; i < eventsPerDay; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const hour = Math.floor(Math.random() * 14) + 7; // 7 AM to 9 PM
      const minute = Math.floor(Math.random() * 60);
      const eventDate = new Date(date);
      eventDate.setHours(hour, minute, Math.floor(Math.random() * 60));

      // Weighted event types - more successes than failures
      const weights = [35, 15, 20, 15, 5, 8, 2]; // LOGIN_SUCCESS is most common
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let eventType = eventTypes[0];
      for (let j = 0; j < weights.length; j++) {
        rand -= weights[j];
        if (rand <= 0) {
          eventType = eventTypes[j];
          break;
        }
      }

      // --- ENKRIPSI IP ADDRESS UNTUK AUTH EVENTS ---
      const rawIp = ips[Math.floor(Math.random() * ips.length)];
      const { encryptedData, iv } = encryptIP(rawIp);

      authEvents.push({
        userId: eventType !== 'LOGIN_FAILED' ? user.id : (Math.random() > 0.5 ? user.id : null),
        email: user.email,
        eventType,
        ipAddress: encryptedData, // IP dienkripsi
        ipAddressIv: iv,          // IV disimpan
        userAgent: agents[Math.floor(Math.random() * agents.length)],
        timestamp: eventDate,
      });
    }
  }

  // Batch create auth events
  for (let i = 0; i < authEvents.length; i += 50) {
    await prisma.authEvent.createMany({
      data: authEvents.slice(i, i + 50),
    });
  }
  console.log(`✅ ${authEvents.length} Auth events created`);

  // Authorization Events
  const authzEvents = [];
  const routes = [
    '/api/articles', '/api/articles/all', '/api/documentation',
    '/api/operations', '/api/security/summary', '/api/security/auth-stats',
    '/api/admin/dashboard', '/api/upload', '/api/auth/me',
  ];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];

  for (let day = 30; day >= 0; day--) {
    const date = new Date(now - day * 24 * 60 * 60 * 1000);
    const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
    const eventsPerDay = isWeekday ? Math.floor(Math.random() * 12) + 6 : Math.floor(Math.random() * 5) + 2;

    for (let i = 0; i < eventsPerDay; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const route = routes[Math.floor(Math.random() * routes.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const hour = Math.floor(Math.random() * 14) + 7;
      const eventDate = new Date(date);
      eventDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      // Admin routes should be denied for regular users
      const isAdminRoute = route.includes('security') || route.includes('admin') || route.includes('all');
      const allowed = user.role === 'admin' || !isAdminRoute;

      authzEvents.push({
        userId: user.id,
        route,
        method,
        role: user.role,
        allowed,
        timestamp: eventDate,
      });
    }
  }

  for (let i = 0; i < authzEvents.length; i += 50) {
    await prisma.authorizationEvent.createMany({
      data: authzEvents.slice(i, i + 50),
    });
  }
  console.log(`✅ ${authzEvents.length} Authorization events created`);

  // Audit Logs
  const auditLogs = [];
  const actions = ['GET /articles', 'POST /articles', 'GET /documentation', 'PUT /operations', 'GET /auth/me', 'POST /auth/login', 'POST /auth/logout', 'GET /security/summary', 'POST /upload'];
  const resources = ['articles', 'documentation', 'operations', 'auth', 'security', 'upload'];

  for (let day = 30; day >= 0; day--) {
    const date = new Date(now - day * 24 * 60 * 60 * 1000);
    const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
    const eventsPerDay = isWeekday ? Math.floor(Math.random() * 30) + 20 : Math.floor(Math.random() * 15) + 5;

    for (let i = 0; i < eventsPerDay; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const hour = Math.floor(Math.random() * 14) + 7;
      const eventDate = new Date(date);
      eventDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      // --- ENKRIPSI IP ADDRESS UNTUK AUDIT LOGS ---
      const rawIp = ips[Math.floor(Math.random() * ips.length)];
      const { encryptedData, iv } = encryptIP(rawIp);

      auditLogs.push({
        userId: Math.random() > 0.2 ? user.id : null,
        action,
        resource,
        details: JSON.stringify({ statusCode: Math.random() > 0.1 ? 200 : (Math.random() > 0.5 ? 403 : 401), duration: `${Math.floor(Math.random() * 200) + 10}ms` }),
        ipAddress: encryptedData, // IP dienkripsi
        ipAddressIv: iv,          // IV disimpan
        userAgent: agents[Math.floor(Math.random() * agents.length)],
        timestamp: eventDate,
      });
    }
  }

  for (let i = 0; i < auditLogs.length; i += 50) {
    await prisma.auditLog.createMany({
      data: auditLogs.slice(i, i + 50),
    });
  }
  console.log(`✅ ${auditLogs.length} Audit logs created`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test accounts:');
  console.log('  Admin: admin@bpkb-ipb.ac.id / admin123');
  console.log('  User:  jordan@apps.ipb.ac.id / password123');
  console.log('  User:  hanifah@apps.ipb.ac.id / password123');
  console.log('  User:  naufal@apps.ipb.ac.id / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });