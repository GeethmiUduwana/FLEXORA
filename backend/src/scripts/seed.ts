import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { BusinessMembership } from '../models/BusinessMembership.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { UserRole, AccountStatus, MembershipStatus } from '../types/index.js';
import { seedCategoriesAndTypes } from './seedCategories.js';
import { seedModuleCatalog } from './seedModules.js';

async function seed() {
  console.log('🌱 Starting Flexora development seed script...');

  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ Safety check: Seeding is blocked in production environment.');
    process.exit(1);
  }

  await connectDatabase();

  const BCRYPT_SALT_ROUNDS = 12;

  const usersToSeed = [
    {
      email: 'admin@flexora.com',
      password: process.env.ADMIN_SEED_PASSWORD || 'Admin@123456',
      firstName: 'Platform',
      lastName: 'Administrator',
      role: UserRole.PLATFORM_ADMIN,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      email: 'owner@flexora.com',
      password: process.env.OWNER_SEED_PASSWORD || 'Owner@123456',
      firstName: 'Sarah',
      lastName: 'BusinessOwner',
      role: UserRole.BUSINESS_OWNER,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      email: 'manager@flexora.com',
      password: process.env.MANAGER_SEED_PASSWORD || 'Manager@123456',
      firstName: 'Michael',
      lastName: 'OperationsManager',
      role: UserRole.MANAGER,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    },
    {
      email: 'staff@flexora.com',
      password: process.env.STAFF_SEED_PASSWORD || 'Staff@123456',
      firstName: 'Emma',
      lastName: 'TeamStaff',
      role: UserRole.STAFF,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    },
  ];

  const demoTenantId = 'tenant_demo_acme_corp';

  for (const u of usersToSeed) {
    const existing = await User.findOne({ email: u.email });
    let userId: mongoose.Types.ObjectId;

    if (existing) {
      console.log(`ℹ️  User ${u.email} (${u.role}) already exists, updating status & password...`);
      existing.passwordHash = await bcrypt.hash(u.password, BCRYPT_SALT_ROUNDS);
      existing.status = u.status;
      existing.role = u.role;
      await existing.save();
      userId = existing._id;
    } else {
      const passwordHash = await bcrypt.hash(u.password, BCRYPT_SALT_ROUNDS);
      const created = await User.create({
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
        isEmailVerified: u.isEmailVerified,
      });
      userId = created._id;
      console.log(`✅ Created test user: ${u.email} [${u.role}]`);
    }

    // Provision demo membership for non-admin roles
    if (u.role !== UserRole.PLATFORM_ADMIN) {
      await BusinessMembership.findOneAndUpdate(
        { user: userId, tenantId: demoTenantId },
        {
          user: userId,
          tenantId: demoTenantId,
          role: u.role,
          status: MembershipStatus.ACTIVE,
        },
        { upsert: true }
      );
    }
  }

  // Seed business categories and types
  await seedCategoriesAndTypes();

  // Seed module categories and reusable modules
  await seedModuleCatalog();

  console.log('\n🎉 Flexora dev seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Test Accounts available:');
  console.log('1. Platform Admin:  admin@flexora.com   / Admin@123456');
  console.log('2. Business Owner:  owner@flexora.com   / Owner@123456');
  console.log('3. Manager:         manager@flexora.com / Manager@123456');
  console.log('4. Staff:           staff@flexora.com   / Staff@123456');
  console.log('----------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
