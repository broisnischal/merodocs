import { AccessRightEnum, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import {
  superAdminPermissions,
  superadminPermissionNames,
} from 'src/api/superadmin/common/constants/route-permissions';

const CLOUDFRONT = process.env.CLOUDFRONT + 'static/';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$transaction(async (prisma) => {
      const isAlreadySuperAdmin = await prisma.superAdmin.findFirst({});
      if (!isAlreadySuperAdmin) {
        const admin = await prisma.superAdmin.create({
          data: {
            email: 'vmsadmin@gmail.com',
            name: 'VMS Admin',
            gender: 'male',
            contact: '9823000000',
            dob: new Date().toISOString(),
            password: bcrypt.hashSync('Test@123', 10),
            role: {
              create: {
                name: 'Superadmin',
              },
            },
          },
        });

        await prisma.superAdminPermission.createMany({
          data: superadminPermissionNames.map((i) => {
            return {
              roleId: admin.roleId,
              children: superAdminPermissions[i],
              name: i,
              access: AccessRightEnum.readwriteanddelete,
            };
          }),
        });
      }

      const deliveryNames = [
        `daraz`,
        `sasto deal`,
        `upaya`,
        `zapp`,
        `gyapu`,
        `okdam`,
        `thulo`,
        `deal ayo`,
        `socheko`,
        `mero shopping`,
        `smart doko`,
        `muncha`,
        `foodmandu`,
        `bhojdeals`,
        `pathao food`,
        `wl food`,
        `foodmario`,
        `bhok lagyo`,
        `mero launch`,
        'door to door tiffin',
        `bhokmandu`,
        `ekbaje`,
      ];

      for (const name of deliveryNames) {
        const serviceProvider = await prisma.serviceProvider.create({
          data: {
            name,
            forAll: true,
            type: 'delivery',
          },
        });

        await prisma.file.create({
          data: {
            url: `${CLOUDFRONT}${name.split(' ').join()}.png`,
            serviceProviderId: serviceProvider.id,
          },
        });
      }

      const rideNames = [
        `indrive`,
        `pathao`,
        `tootle`,
        `sajilo`,
        `taximandu`,
        `edrive`,
        `jumjum`,
      ];

      for (const name of rideNames) {
        const serviceProvider = await prisma.serviceProvider.create({
          data: {
            name,
            forAll: true,
            type: 'ride',
          },
        });

        await prisma.file.create({
          data: {
            url: `${CLOUDFRONT}${name}.png`,
            serviceProviderId: serviceProvider.id,
          },
        });
      }

      const serviceNames = [
        `cook`,
        `maid`,
        `laundry`,
        `doctor`,
        `driver`,
        `gardener`,
        `milkman`,
        `car cleaner`,
        `grocery`,
        `teacher`,
        `health fitness`,
        `beautician`,
        `internet service providers`,
      ];

      for (const name of serviceNames) {
        const serviceType = await prisma.serviceType.create({
          data: {
            name,
            forAll: true,
          },
        });

        await prisma.file.create({
          data: {
            url: `${CLOUDFRONT}${name}.png`,
            serviceTypeId: serviceType.id,
          },
        });
      }

      const vehicleNames = [
        `ambulance`,
        `garbage truck`,
        `school bus`,
        `delivery vehicles`,
        `service and maintenance vehicles`,
        `fire vehicles`,
        `police vehicles`,
        `landscaping trucks`,
        `food services`,
        `ride sharing`,
        `internet service providers`,
        `government services`,
        'water tanker',
      ];

      for (const name of vehicleNames) {
        const vehicleList = await prisma.vehicleList.create({
          data: {
            name,
            forAll: true,
          },
        });

        await prisma.file.create({
          data: {
            url: `${CLOUDFRONT}${name}.png`,
            vehicleListId: vehicleList.id,
          },
        });
      }

      await prisma.background.createMany({
        data: [
          { image: `${CLOUDFRONT}birthday.png` },
          { image: `${CLOUDFRONT}anniversary.png` },
          { image: `${CLOUDFRONT}babyshower.png` },
          { image: `${CLOUDFRONT}bridalshower.png` },
          { image: `${CLOUDFRONT}wedding.png` },
          { image: `${CLOUDFRONT}engagement.png` },
          { image: `${CLOUDFRONT}familyreunion.png` },
          { image: `${CLOUDFRONT}holiday.png` },
          { image: `${CLOUDFRONT}funeral.png` },
          { image: `${CLOUDFRONT}petmemorial.png` },
        ],
      });

      await prisma.personalStaffRole.createMany({
        data: [
          { name: 'driver' },
          { name: 'rider' },
          { name: 'maid' },
          { name: 'nanny' },
          { name: 'milkman' },
          { name: 'newspaper' },
          { name: 'car cleaner' },
        ],
      });
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('Seed completed 🌱');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
