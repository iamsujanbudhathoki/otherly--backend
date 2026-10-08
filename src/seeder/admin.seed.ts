import { AppDataSource } from '../config/database.config';
import { Role } from '../constants/appConstant';
import { Admin, AdminPermission } from '../entities/admin/Admin.entity';

const ADMINS = [
  {
    name: 'Otherly Admin',
    email: 'admin@otherly.com',
    password: 'Admin@123',
    role: Role.ADMIN,
    permissions: [
      AdminPermission.PRODUCT,
      AdminPermission.CATEGORIES,
      AdminPermission.REQUESTS,
      AdminPermission.OFFERS,
      AdminPermission.ORDERS,
      AdminPermission.VENDORS,
      AdminPermission.CUSTOMERS,
      AdminPermission.CONTACTS,
      AdminPermission.LOGS,
    ],
    isActive: true,
  },
  {
    name: 'Otherly Super Admin',
    email: 'superadmin@otherly.com',
    password: 'SuperAdmin@123',
    role: Role.SUPER_ADMIN,
    isActive: true,
  },
];

const args = process.argv.slice(2)[0];
const AdminRepo = AppDataSource.getRepository(Admin);

const seedAll = async () => {
  for (const item of ADMINS) {
    try {
      const existing = await AdminRepo.findOne({
        where: { email: item.email },
      });
      if (!existing) {
        const admin = AdminRepo.create(item);
        await AdminRepo.save(admin);
      }
    } catch (error: any) {
      console.error('Failed to seed admin', error);
      return;
    }
  }
  console.log('Otherly Admins seeded successfully');

  await AppDataSource.destroy();
  process.exit(0);
};

const removeAll = async () => {
  try {
    await AdminRepo.createQueryBuilder().delete().execute();
  } catch (error: any) {
    console.error('Failed to delete seeded records', error);
    process.exit(1);
  }
  console.log('Seeded records removed successfully');
  await AppDataSource.destroy();
  process.exit(0);
};

AppDataSource.initialize()
  .then(() => {
    if (args === 'add') {
      seedAll();
    } else if (args === 'remove') {
      removeAll();
    } else {
      console.log('Please provide a valid argument: add | remove');
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
