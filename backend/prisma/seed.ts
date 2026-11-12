import { PrismaClient, Role, UserStatus, AccountStatus, AccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial BalanceVault data...');

  // 1. Create Initial Admin
  const adminEmail = 'admin@balancevault.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  let adminUser;
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Admin@123456', salt);

    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'System Administrator',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`Initial Admin created: ${adminEmail} (password: Admin@123456)`);
  } else {
    adminUser = existingAdmin;
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // 2. Create Platform Clearing Account
  const clearingAccountNumber = 'ACC-CLEARING-001';
  const existingClearing = await prisma.account.findUnique({
    where: { accountNumber: clearingAccountNumber },
  });

  if (!existingClearing) {
    await prisma.account.create({
      data: {
        accountNumber: clearingAccountNumber,
        currency: 'USD',
        accountType: AccountType.PLATFORM_CLEARING,
        status: AccountStatus.ACTIVE,
        cachedBalance: 0,
      },
    });
    console.log(`Platform clearing account created: ${clearingAccountNumber}`);
  } else {
    console.log(`Platform clearing account already exists: ${clearingAccountNumber}`);
  }

  // 3. Record Initial Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: 'SYSTEM_SEEDED',
      resourceType: 'SYSTEM',
      resourceId: 'SYSTEM',
      metadata: {
        message: 'Initial admin and platform clearing account seeded',
      },
    },
  });

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

