import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';


async function main() {
  console.log('Starting database seed...');

  // ============================================
  // CREAR AEROLÍNEAS
  // ============================================
  
  console.log('📦 Creating airlines...');

  const americanAirlines = await prisma.airline.upsert({
    where: { code: 'AA' },
    update: {},
    create: {
      name: 'American Airlines',
      code: 'AA',
      logo: 'https://example.com/aa-logo.png',
      branding: {
        primaryColor: '#0078D2',
        secondaryColor: '#C8102E',
      },
    },
  });

  const deltaAirlines = await prisma.airline.upsert({
    where: { code: 'DL' },
    update: {},
    create: {
      name: 'Delta Air Lines',
      code: 'DL',
      logo: 'https://example.com/delta-logo.png',
      branding: {
        primaryColor: '#003A70',
        secondaryColor: '#CE0E2D',
      },
    },
  });

  console.log('Airlines created!');

  // ============================================
  // CREAR USUARIOS
  // ============================================

  console.log('Creating users...');

  // Hash para todas las passwords
  const defaultPassword = await bcrypt.hash('Admin123!', 12);

  // Super Admin (puede gestionar todo)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      password: defaultPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      airlineId: null, // No tiene aerolínea específica
    },
  });

  // Admin de American Airlines
  const aaAdmin = await prisma.user.upsert({
    where: { email: 'admin@aa.com' },
    update: {},
    create: {
      email: 'admin@aa.com',
      password: defaultPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'ADMIN',
      airlineId: americanAirlines.id,
    },
  });

  // Editor de American Airlines
  const aaEditor = await prisma.user.upsert({
    where: { email: 'editor@aa.com' },
    update: {},
    create: {
      email: 'editor@aa.com',
      password: defaultPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'EDITOR',
      airlineId: americanAirlines.id,
    },
  });

  // Viewer de Delta
  const deltaViewer = await prisma.user.upsert({
    where: { email: 'viewer@delta.com' },
    update: {},
    create: {
      email: 'viewer@delta.com',
      password: defaultPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'VIEWER',
      airlineId: deltaAirlines.id,
    },
  });

  console.log('✅ Users created!');

  // ============================================
  // CREAR MANUAL DE EJEMPLO
  // ============================================

  console.log('📚 Creating sample manual...');

  const chapter1 = await prisma.manualChapter.create({
    data: {
      title: 'Safety Procedures',
      description: 'Standard safety operating procedures and protocols',
      order: 1,
      airlineId: americanAirlines.id,
      sections: {
        create: [
          {
            title: 'Pre-Flight Safety Check',
            description: 'Safety checks to perform before departure',
            order: 1,
            contents: {
              create: [
                {
                  title: 'Cabin Safety Equipment',
                  type: 'TEXT',
                  content:
                    '<h2>Cabin Safety Equipment</h2><p>Ensure all safety equipment is properly installed and functional...</p>',
                  order: 1,
                },
                {
                  title: 'Emergency Exit Diagram',
                  type: 'IMAGE',
                  content: 'https://example.com/exit-diagram.png',
                  order: 2,
                  metadata: {
                    fileSize: '256KB',
                    dimensions: '1920x1080',
                  },
                },
              ],
            },
          },
          {
            title: 'In-Flight Emergency Procedures',
            description: 'Procedures to follow during in-flight emergencies',
            order: 2,
            contents: {
              create: [
                {
                  title: 'Emergency Landing Protocol',
                  type: 'TEXT',
                  content:
                    '<h2>Emergency Landing</h2><p>Step-by-step procedures for emergency landing situations...</p>',
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Sample manual created!');

  // ============================================
  // RESUMEN
  // ============================================

  console.log('\n✅ Database seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Airlines: 2');
  console.log('   - Users: 4');
  console.log('   - Manual Chapters: 1');
  console.log('   - Manual Sections: 2');
  console.log('   - Manual Contents: 3\n');
  console.log('🔐 Login credentials (password for all: Admin123!):');
  console.log('   - admin@admin.com (SUPER_ADMIN)');
  console.log('   - admin@aa.com (ADMIN - American Airlines)');
  console.log('   - editor@aa.com (EDITOR - American Airlines)');
  console.log('   - viewer@delta.com (VIEWER - Delta Air Lines)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });