import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from '../../common/interface';
import {
  updateClientDto,
  createClientDto,
  checkUniqueDto,
} from './dtos/index.dto';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { FileService } from 'src/global/file/file.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { ApartmentStatus, PayStatus } from '@prisma/client';
import { RoutePermissionCollection } from 'src/api/admin/common/enums';
import { getPageDocs, pagination, timeDifference } from 'src/common/utils';
import bcrypt from 'bcryptjs';
import { calculateEndDate } from '../../utils/enddate.utils';

@Injectable()
export class ClientService {
  constructor(
    private readonly prismaTransaction: PrismaTransactionService,
    private readonly fileService: FileService,
    private readonly prisma: PrismaService,
  ) {}

  async checkUnique(data: CreateParams<checkUniqueDto>) {
    const { postData } = data;

    const { email, apartmentname } = postData;

    if (!email && !apartmentname) {
      throw new BadRequestException(
        'At least email or apartment name should be passed',
      );
    }

    if (email) {
      const valid = await this.prisma.adminUser.findUnique({
        where: {
          email,
        },
      });

      if (valid) throw new ConflictException('Email already exists');
    }

    if (apartmentname) {
      const valid = await this.prisma.apartment.findFirst({
        where: {
          name: apartmentname,
        },
      });

      if (valid) throw new ConflictException('Apartment name already exists');
    }
  }

  async create(data: CreateParams<createClientDto>) {
    const { postData, loggedUserData } = data;
    const {
      name,
      email,
      contact,
      dob,
      gender,
      apartmentname,
      country,
      province,
      city,
      area,
      postalcode,
      type,
      enddate,
      price,
      time,
      pattern,
      firstPayment: providedFirstPayment,
      password,
    } = postData;

    const [emailExist, apartmentExist] = await Promise.all([
      this.prisma.adminUser.findUnique({ where: { email } }),
      this.prisma.apartment.findFirst({ where: { name: apartmentname } }),
    ]);

    if (emailExist) throw new ConflictException('Email already exists');
    if (apartmentExist)
      throw new ConflictException('Apartment name already exists');

    let date;
    let remaining = 0;
    let paid = 0;
    let firstPayment = providedFirstPayment;

    // Type specific validations
    if (type === 'free') {
      if (!enddate || enddate < new Date())
        throw new BadRequestException(
          'End Date is required for free subscriptions or cannot be in the past',
        );
    } else if (type === 'paid') {
      if (!price || !time || !pattern)
        throw new BadRequestException(
          'Price, time, pattern are required for paid subscriptions',
        );

      if (pattern === 'installment') {
        if (!firstPayment)
          throw new BadRequestException(
            'First payment is required for installment pattern subscriptions',
          );
        remaining = price - firstPayment;
        paid = firstPayment;
      } else {
        firstPayment = price;
        remaining = 0;
        paid = price;
      }

      date = calculateEndDate(new Date(), time);
    }

    const result = this.prismaTransaction.$transaction(async (prisma) => {
      const apartment = await prisma.apartment.create({
        data: {
          name: apartmentname,
          mainUser: email,
          country,
          province,
          city,
          area,
          postalcode,
          subscription:
            type === 'free' ? 'free_trial' : remaining === 0 ? 'paid' : 'due',
          createdById: loggedUserData.id,
          updatedById: loggedUserData.id,
        },
      });

      await prisma.documentType.create({
        data: {
          name: 'move-out',
          atSignUp: true,
          apartmentId: apartment.id,
        },
      });

      const role = await prisma.adminRole.create({
        data: {
          name: 'superadmin',
          apartmentId: apartment.id,
        },
      });

      if (!role) throw new ConflictException('Could not create role');

      await prisma.adminPermission.createMany({
        data: RoutePermissionCollection.map((item) => {
          return {
            name: item,
            access: 'readwriteanddelete',
            roleId: role.id,
          };
        }),
        skipDuplicates: true,
      });

      const hashed = bcrypt.hashSync(password, 10);

      const user = await prisma.adminUser.create({
        data: {
          name,
          email,
          contact,
          dob,
          gender,
          password: hashed,
          firstLoggedIn: true,
          apartmentId: apartment.id,
          roleId: role.id,
        },
      });

      const subscriptionData = {
        type,
        endAt: type === 'free' ? enddate : date,
        price: type === 'free' ? null : price,
        time: type === 'free' ? null : time,
        pattern: type === 'free' ? null : pattern,
        paid: type === 'free' ? null : firstPayment,
        remaining: type === 'free' ? null : remaining,
        apartmentId: apartment.id,
      };

      const subscription = await prisma.subscription.create({
        data: subscriptionData,
      });

      await prisma.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          paid,
        },
      });

      return user.id;
    });

    return result;
  }

  async getAllDocuments() {
    const document = await this.prisma.documentSetting.findMany({
      where: {
        archive: false,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return document;
  }

  async getAll(data: GetAllParams) {
    const { filter, subscription, q } = data;
    const { page, limit, skip } = pagination({
      page: data.page,
      limit: data.limit,
    });

    const isStatusValid = filter
      ? Object.values(ApartmentStatus).includes(filter as ApartmentStatus)
      : true;

    const isSubscriptionValid = subscription
      ? Object.values(PayStatus).includes(subscription as PayStatus)
      : true;

    if (filter && !isStatusValid) {
      throw new NotFoundException('Status filter does not exist');
    }

    if (subscription && !isSubscriptionValid) {
      throw new NotFoundException('Subscription filter does not exist');
    }

    const whereCondition: any = {};

    if (filter) {
      whereCondition.status = filter;
    }

    if (subscription) {
      whereCondition.subscription = subscription;
    }

    const details = await this.prisma.apartment.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        area: true,
        city: true,
        country: true,
        postalcode: true,
        province: true,
        createdAt: true,
        status: true,
        subscription: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let result = await Promise.all(
      details.map(async (item) => {
        const [blockCount, floorCount, flatCount, residentCount, client] =
          await Promise.all([
            this.prisma.block.count({
              where: {
                apartmentId: item.id,
              },
            }),
            this.prisma.floor.count({
              where: {
                apartmentId: item.id,
              },
            }),
            this.prisma.flat.count({
              where: {
                apartmentId: item.id,
              },
            }),
            this.prisma.clientUser.count({
              where: {
                clientApartments: {
                  some: {
                    status: 'approved',
                    flat: {
                      apartmentId: item.id,
                    },
                  },
                },
              },
            }),
            this.prisma.adminUser.findFirst({
              where: {
                apartmentId: item.id,
                role: {
                  name: 'superadmin',
                },
              },
              select: {
                id: true,
                image: {
                  select: {
                    url: true,
                  },
                },
                name: true,
                contact: true,
                hasLoggedIn: true,
              },
            }),
          ]);

        return {
          ...item,
          blockCount,
          floorCount,
          flatCount,
          residentCount,
          client,
        };
      }),
    );

    if (q) {
      result = result.filter(
        (apartment) =>
          (apartment.name && apartment.name.includes(q)) ||
          (apartment.client && apartment.client.name.includes(q)),
      );
    }

    const count = result.length;

    const docs = getPageDocs({
      page,
      limit,
      count,
    });

    const paginatedResult = result.slice(skip, skip + limit);

    return { docs, result: paginatedResult };
  }

  async getDetails(data: GetParam) {
    const { id } = data;

    const apartment = await this.prisma.apartment.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        area: true,
        city: true,
        country: true,
        postalcode: true,
        province: true,
        status: true,
        createdBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        adminUsers: {
          where: {
            role: {
              name: 'superadmin',
            },
            apartmentId: id,
          },
          select: {
            id: true,
            image: {
              select: {
                url: true,
              },
            },
            name: true,
            contact: true,
            email: true,
            gender: true,
            dob: true,
          },
        },
      },
    });

    if (!apartment) throw new NotFoundException('Client doesnot exist');

    const blockCount = await this.prisma.block.count({
      where: {
        apartmentId: apartment.id,
      },
    });

    const floorCount = await this.prisma.floor.count({
      where: {
        apartmentId: apartment.id,
      },
    });

    const flatCount = await this.prisma.flat.count({
      where: {
        apartmentId: apartment.id,
      },
    });

    const residentCount = await this.prisma.clientUser.count({
      where: {
        clientApartments: {
          some: {
            status: 'approved',
            flat: {
              apartmentId: apartment.id,
            },
          },
        },
      },
    });

    const result = {
      apartment: {
        blockCount,
        floorCount,
        flatCount,
        residentCount,
        ...apartment,
      },
    };

    return result;
  }

  async getSubscription(data: GetParam) {
    const { id } = data;

    const apartment = await this.prisma.apartment.findFirst({
      where: { id },
      select: {
        subscriptions: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            endAt: true,
            type: true,
            price: true,
            remaining: true,
            paid: true,
            time: true,
            pattern: true,
            expireReason: true,
            expiredBy: {
              select: {
                name: true,
                image: {
                  select: {
                    url: true,
                  },
                },
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            updatedBy: {
              select: {
                name: true,
                image: {
                  select: {
                    url: true,
                  },
                },
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            history: {
              select: {
                id: true,
                paid: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!apartment) throw new NotFoundException('Client doesnot exist');

    const subscriptions = apartment.subscriptions.map((subscription) => {
      const timeDiff = timeDifference(new Date(), subscription.endAt);
      return { ...subscription, timeDifference: timeDiff };
    });

    return subscriptions;
  }

  async getDocuments(data: GetParam) {
    const { id } = data;

    const apartment = await this.prisma.apartment.findFirst({
      where: { id },
      select: {
        adminUsers: {
          where: {
            role: {
              name: 'superadmin',
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!apartment) throw new NotFoundException('Client doesnot exist');

    const documents = await this.prisma.documentSetting.findMany({
      where: {
        archive: false,
      },
      select: {
        id: true,
        name: true,
        files: {
          where: {
            uploadedForId: apartment.adminUsers[0].id,
          },
          select: {
            id: true,
            url: true,
            name: true,
          },
        },
      },
    });

    return documents;
  }

  async update(data: UpdateParams<updateClientDto>) {
    const { id, postData } = data;
    const validUser = await this.prisma.adminUser.findFirst({
      where: {
        id,
      },
    });
    if (!validUser) throw new NotFoundException('User does not exists');

    const { contact, dob, gender, name } = postData;

    const user = await this.prisma.adminUser.update({
      where: {
        id,
      },
      data: {
        contact,
        dob,
        gender,
        name,
      },
    });

    return user.id;
  }

  async upload(data: UpdateParams<Express.Multer.File>) {
    const { id, postData } = data;

    const valid = await this.prisma.adminUser.findFirst({
      where: { id },
      select: { image: true },
    });

    if (!valid) throw new NotFoundException('User doesnot exist');

    const file = await this.fileService.createOrUpdate({
      file: postData,
      type: 'image',
      existedFile: valid.image ? valid.image : undefined,
    });

    const user = await this.prisma.adminUser.update({
      where: { id },
      data: {
        image: {
          connect: file,
        },
      },
      select: {
        image: {
          select: {
            url: true,
          },
        },
      },
    });

    return user;
  }

  async uploadMultipleDocuments(
    data: UpdateParams<Array<Express.Multer.File>>,
  ) {
    const { id, postData, withId } = data;

    const validUser = await this.prisma.adminUser.findFirst({
      where: { id },
    });

    if (!validUser) throw new NotFoundException('User doesnot exist');

    const validDocument = await this.prisma.documentSetting.findFirst({
      where: { id: withId },
    });

    if (!validDocument) throw new NotFoundException('Document doesnot exist');

    const file = await this.fileService.createDocumentFile({
      files: postData,
      settingId: withId,
      uploadedForId: validUser.id,
    });

    return file;
  }

  async deleteClient(data: DeleteParams) {
    const { id } = data;

    const validUser = await this.prisma.adminUser.findFirst({
      where: {
        apartmentId: id,
        role: {
          name: 'superadmin',
        },
      },
    });

    if (!validUser) throw new NotFoundException('User doesnot exist');

    const checkLogin = await this.prisma.adminUser.findFirst({
      where: { id: validUser.id, hasLoggedIn: true },
    });

    if (checkLogin)
      throw new BadRequestException('Cannot delete use. It is already active');

    const user = await this.prisma.apartment.delete({
      where: {
        id,
      },
    });

    return user;
  }

  async deleteDocument(data: DeleteParams) {
    const { id } = data;

    const file = await this.prisma.documentFile.findUnique({
      where: {
        id,
      },
    });

    if (!file) throw new NotFoundException('File does not exist');

    await this.fileService.deleteDocumentFile(id);
  }
}
