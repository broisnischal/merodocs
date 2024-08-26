import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientStaffStatus, ClientUserTopType, Prisma } from '@prisma/client';
import { FileService } from 'src/global/file/file.service';
import { AssignedUserParam } from '../../common/interfaces';
import { createClientStaffDto, updateClientStaffDto } from './dto/staff.dto';
import { AttendanceService } from 'src/global/attendance/attendance.service';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import moment from 'moment';

@Injectable()
export class StaffService {
  constructor(
    private readonly prismaTransaction: PrismaTransactionService,
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async getStaffs({
    extend,
    user,
  }: AssignedUserParam.GetAll<{ type?: ClientStaffStatus }>) {
    return this.prisma.clientStaff.findMany({
      where: {
        apartmentId: user.apartmentId,
        flats: {
          some: {
            id: user.flatId,
          },
        },
        status: extend?.type,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        image: {
          select: {
            id: true,
            url: true,
          },
        },
        document: {
          select: {
            id: true,
            url: true,
          },
        },
        personalStaffRole: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getStaffRoles(query: string) {
    if (query.length > 1) {
      return this.prisma.personalStaffRole.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
      });
    } else {
      return this.prisma.personalStaffRole.findMany({});
    }
  }

  async addStaffToFlat({ id, user }: AssignedUserParam.Update<undefined>) {
    const staff = await this.prisma.clientStaff.findUnique({
      where: {
        id,
        apartmentId: user.apartmentId,
      },
    });

    const flat = await this.prisma.flat.findUnique({
      where: {
        id: user.flatId,
      },
    });

    if (!staff || !flat) {
      throw new NotFoundException('User or flat not found');
    }

    const transaction = await this.prismaTransaction.$transaction(
      async (prisma) => {
        if (user.currentState.type == 'owner_family') {
          const ownerInFlat = await prisma.flatCurrentClient.findFirst({
            where: {
              flatId: user.flatId,
              type: 'owner',
            },
            include: {
              clientUser: {
                select: {
                  id: true,
                },
              },
            },
          });

          if (!ownerInFlat)
            throw new Prisma.PrismaClientKnownRequestError('Owner not found', {
              clientVersion: '2.24.1',
              code: 'C409',
            });

          await prisma.clientStaffLog.create({
            data: {
              clientUserType:
                user.currentState.type === 'owner_family'
                  ? 'owner'
                  : user.currentState.type === 'tenant_family'
                    ? 'tenant'
                    : user.currentState.type,
              flatId: flat.id,
              apartmentId: user.apartmentId,
              clientUserId: ownerInFlat?.clientUser.id,
              clientStaffId: staff.id,
            },
          });
        } else if (user.currentState.type == 'tenant_family') {
          const tenantInFlat = await prisma.flatCurrentClient.findFirst({
            where: {
              flatId: user.flatId,
              type: 'tenant',
            },
            include: {
              clientUser: {
                select: {
                  id: true,
                },
              },
            },
          });

          if (!tenantInFlat)
            throw new Prisma.PrismaClientKnownRequestError('Tenant not found', {
              clientVersion: '2.24.1',
              code: 'C409',
            });

          await prisma.clientStaffLog.create({
            data: {
              clientUserType:
                user.currentState.type === 'tenant_family'
                  ? 'owner'
                  : user.currentState.type === 'tenant_family'
                    ? 'tenant'
                    : user.currentState.type,
              flatId: flat.id,
              apartmentId: user.apartmentId,
              clientUserId: tenantInFlat?.clientUser.id,
              clientStaffId: staff.id,
            },
          });
        } else if (
          user.currentState.type == 'owner' ||
          user.currentState.type == 'tenant'
        ) {
          await prisma.clientStaffLog.create({
            data: {
              clientUserType:
                user.currentState.type === 'owner'
                  ? 'owner'
                  : user.currentState.type === 'tenant'
                    ? 'tenant'
                    : user.currentState.type,
              flatId: flat.id,
              apartmentId: user.apartmentId,
              clientUserId: user.id,
              clientStaffId: staff.id,
            },
          });
        }

        const update = await prisma.flat.update({
          where: {
            id: flat.id,
          },
          data: {
            clientStaffs: {
              connect: {
                id: staff.id,
              },
            },
          },
        });

        return update;
      },
    );

    return transaction;
  }

  async removeStaffFromFlat({ user, id }: AssignedUserParam.Delete) {
    const staff = await this.prisma.clientStaff.findUnique({
      where: {
        id,
        flats: {
          some: {
            id: user.flatId,
          },
        },
      },
    });

    const flat = await this.prisma.flat.findUnique({
      where: {
        id: user.flatId,
      },
    });

    if (!staff || !flat) {
      throw new NotFoundException('User or flat not found');
    }

    const update = await this.prisma.flat.update({
      where: {
        id: flat.id,
      },
      data: {
        clientStaffs: {
          disconnect: {
            id: staff.id,
          },
        },
      },
    });

    return update;
  }

  async search({ q, user }: AssignedUserParam.GetAll) {
    const data = await this.prisma.clientStaff.findMany({
      where: {
        apartmentId: user.apartmentId,
        citizenshipNo: q
          ? {
              contains: q,
              mode: 'insensitive',
            }
          : undefined,
        status: 'approved',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        flats: true,
        personalStaffRole: {
          select: {
            id: true,
            name: true,
          },
        },
        image: {
          select: {
            id: true,
            url: true,
          },
        },
        document: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    const response = data.map((item) => {
      return {
        ...item,
        added: item.flats.some((flat) => flat.id === user.flatId),
      };
    });
    return response;
  }

  async getId({ id, user }: AssignedUserParam.Get) {
    const data = await this.prisma.clientStaff.findUnique({
      where: {
        id,
        apartmentId: user.apartmentId,
      },
      include: {
        personalStaffRole: {
          select: {
            id: true,
            name: true,
          },
        },
        image: {
          select: {
            id: true,
            url: true,
          },
        },
        document: {
          select: {
            id: true,
            url: true,
          },
        },
        gatePass: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    if (!data) throw new NotFoundException('Staff not found');

    return data;
  }

  async registerStaff({
    body,
    user,
  }: AssignedUserParam.Create<
    createClientStaffDto & {
      citizenshipFrontImage: Express.Multer.File;
      citizenshipBackImage: Express.Multer.File;
      profile: Express.Multer.File;
    }
  >) {
    let mainUserType: ClientUserTopType;

    const alreadyExistsWithCitizenship =
      await this.prisma.clientStaff.findFirst({
        where: {
          apartmentId: user.apartmentId,
          citizenshipNo: body.citizenshipNo,
        },
      });

    if (alreadyExistsWithCitizenship) {
      throw new BadRequestException(
        'Citizenship already exists with the user!',
      );
    }

    if (user.currentState.type === 'owner_family') {
      mainUserType = 'owner';
    } else if (user.currentState.type === 'tenant_family') {
      mainUserType = 'tenant';
    } else {
      mainUserType = user.currentState.type;
    }

    let currentFlatMainUser: {
      id: string;
      type: ClientUserTopType;
    } = {
      id: user.id,
      type: mainUserType,
    };

    if (
      user.currentState.type !== 'owner' &&
      user.currentState.type !== 'tenant'
    ) {
      const currentMain = await this.prisma.flatCurrentClient.findFirst({
        where: {
          type: mainUserType,
          flatId: user.flatId,
        },
        select: {
          clientUserId: true,
        },
      });

      if (!currentMain)
        throw new ConflictException('Top account not found for this flat');

      currentFlatMainUser.id = currentMain?.clientUserId;
    }

    const staffRoleIdExists = await this.prisma.personalStaffRole.findUnique({
      where: {
        id: body.staffRoleId,
      },
    });

    if (!staffRoleIdExists) {
      throw new NotFoundException('Staff role not found');
    }

    const transaction = await this.prismaTransaction.$transaction(
      async (prisma) => {
        const data = await prisma.clientStaff.create({
          data: {
            citizenshipNo: body.citizenshipNo,
            contact: body.contact,
            name: body.name,
            apartmentId: user.apartmentId,
            gender: body.gender,
            createdByType: currentFlatMainUser.type,
            createdById: currentFlatMainUser.id,
            emergency_contact: body.econtact,
            bloodgroup: body.bloodgroup,
            personalStaffRoleId: body.staffRoleId,
            dob: body.dob,
            flats: {
              connect: {
                id: user.flatId,
              },
            },
          },
          include: {
            gatePass: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        });

        if (body.citizenshipFrontImage) {
          const citizenshipUpload = await this.fileService.create({
            type: 'image',
            file: body.citizenshipFrontImage,
          });

          if (!citizenshipUpload.url)
            throw new Prisma.PrismaClientKnownRequestError(
              'File upload failed',
              {
                clientVersion: '2.24.1',
                code: 'C409',
              },
            );

          await prisma.clientStaff.update({
            where: {
              id: data.id,
            },
            data: {
              citizenshipFront: citizenshipUpload.url,
              flats: {
                connect: {
                  id: user.flatId,
                },
              },
            },
          });
        }

        if (body.citizenshipBackImage) {
          const citizenshipUpload = await this.fileService.create({
            type: 'image',
            file: body.citizenshipBackImage,
          });

          if (!citizenshipUpload.url)
            throw new Prisma.PrismaClientKnownRequestError(
              'File upload failed',
              {
                clientVersion: '2.24.1',
                code: 'C409',
              },
            );

          await prisma.clientStaff.update({
            where: {
              id: data.id,
            },
            data: {
              citizenshipBack: citizenshipUpload.url,
              flats: {
                connect: {
                  id: user.flatId,
                },
              },
            },
          });
        }

        if (body.profile) {
          const profileUpload = await this.fileService.create({
            type: 'image',
            file: body.profile,
          });

          if (!profileUpload.url)
            throw new Prisma.PrismaClientKnownRequestError(
              'File upload failed',
              {
                clientVersion: '2.24.1',
                code: 'C409',
              },
            );

          await prisma.clientStaff.update({
            where: {
              id: data.id,
            },
            data: {
              image: {
                connect: {
                  id: profileUpload.id,
                },
              },
              flats: {
                connect: {
                  id: user.flatId,
                },
              },
            },
          });
        }

        return data;
      },
    );

    return transaction;
  }

  async updateStaff({
    id,
    user,
    body,
  }: AssignedUserParam.Update<
    updateClientStaffDto & {
      citizenshipFrontImage: Express.Multer.File;
      citizenshipBackImage: Express.Multer.File;
      profile: Express.Multer.File;
    }
  >) {
    const staff = await this.prisma.clientStaff.findUnique({
      where: {
        id,
        apartmentId: user.apartmentId,
        createdById: user.id,
        flats: {
          some: {
            id: user.flatId,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (body.profile) {
      const profileUpload = await this.fileService.create({
        type: 'image',
        file: body.profile,
      });

      await this.prisma.clientStaff.update({
        where: {
          id,
        },
        data: {
          image: {
            connect: {
              id: profileUpload.id,
            },
          },
        },
      });
    }

    if (body.citizenshipFrontImage) {
      const citizenshipUpload = await this.fileService.create({
        type: 'image',
        file: body.citizenshipFrontImage,
      });

      await this.prisma.clientStaff.update({
        where: {
          id,
        },
        data: {
          citizenshipFront: citizenshipUpload.url,
        },
      });
    }

    if (body.citizenshipBackImage) {
      const citizenshipUpload = await this.fileService.create({
        type: 'image',
        file: body.citizenshipBackImage,
      });

      await this.prisma.clientStaff.update({
        where: {
          id,
        },
        data: {
          citizenshipBack: citizenshipUpload.url,
        },
      });
    }

    const data = await this.prisma.clientStaff.update({
      where: {
        id,
      },
      data: {
        citizenshipNo: body.citizenshipNo,
        contact: body.contact,
        name: body.name,
        apartmentId: user.apartmentId,
        emergency_contact: body.econtact,
        bloodgroup: body.bloodgroup,
        gender: body.gender,
        dob: body.dob,
        status: staff.status === 'rejected' ? 'pending' : undefined,
      },
    });

    return data;
  }

  async cancelRequest({ id, user }: AssignedUserParam.Delete) {
    const exists = await this.prisma.clientStaff.findUnique({
      where: {
        id,
        flats: {
          some: {
            id: user.flatId,
          },
        },
      },
    });

    if (!exists) {
      throw new NotFoundException('Staff not found');
    }

    const data = await this.prisma.clientStaff.delete({
      where: {
        id,
      },
      select: {
        document: true,
        image: true,
      },
    });

    data.image && (await this.fileService.delete(data.image.id));
    data.document && (await this.fileService.delete(data.document.id));

    return data;
  }

  async getAttendance({
    user,
    date,
    start,
    end,
    id,
  }: AssignedUserParam.Get & {
    start: Date;
    end: Date;
    type: string;
    date: string;
  }) {
    const valid = await this.prisma.clientStaff.exists(user.apartmentId, {
      where: {
        id,
        archive: false,
        apartmentId: user.apartmentId,
      },
      select: {
        id: true,
        image: { select: { url: true } },
        contact: true,
        name: true,
        personalStaffRole: { select: { name: true } },
        createdAt: true,
        approvedAt: true,
        gatePass: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!valid) throw new NotFoundException('User does not exist');

    const monthData = this.attendanceService.getAllDaysinMonth(date, true);
    const defaultAttendanceData = monthData.days.map((item) => ({
      date: item.date,
      day: item.day,
      present: false,
      pastmonth: item.pastmonth,
      created: moment(item.date).isAfter(valid.approvedAt, 'date'),
      events: [],
    }));

    const attendances = await this.prisma.clientStaffAttendance.findMany({
      where: {
        userId: id,
        createdAt: {
          gte: monthData.startOfMonth,
          lte: monthData.endOfMonth,
        },
      },
      select: {
        id: true,
        date: true,
        events: {
          select: {
            clockedInTime: true,
            clockedOutTime: true,
            duration: true,
          },
        },
      },
    });

    const monthAttendance = defaultAttendanceData.map((item) => {
      const attendance = attendances.find((i) => i.date === item.date);
      if (attendance) {
        return {
          ...item,
          present: true,
          ...attendance,
        };
      } else {
        return item;
      }
    });

    const filteredMonthAttendance = monthAttendance.filter((item) => item);
    const today = new Date();
    const adjustedEndDate = end > today ? today : end;
    const filteredMonth = monthAttendance.filter((item) => {
      if (item?.date) {
        const currentDate = new Date(item.date);
        return currentDate >= start && currentDate <= adjustedEndDate;
      }
    });

    let checkInCount = 0;
    let notCheckedInCount = 0;
    const attendancesCount = await this.prisma.clientStaffAttendance.findMany({
      where: {
        userId: id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    filteredMonth.map((item) => {
      if (item?.date) {
        const attendance = attendancesCount.find((i) => i.date === item.date);
        if (attendance) {
          checkInCount++;
        } else if (
          moment(item.date).startOf('day').isSameOrBefore(valid.createdAt)
        ) {
        } else {
          notCheckedInCount++;
        }
      }
    });

    return {
      valid,
      data: filteredMonthAttendance,
      checkInCount,
      notCheckedInCount,
    };
  }

  async getAttendanceByDate({
    id,
    date,
    user,
  }: AssignedUserParam.Get & {
    date: string;
  }) {
    const valid = await this.prisma.clientStaffAttendance.exists(
      user.apartmentId,
      {
        where: {
          userId: id,
          apartmentId: user.apartmentId,
          date,
        },
        select: {
          id: true,
          date: true,
          events: {
            select: {
              clockedInTime: true,
              clockedOutTime: true,
              duration: true,
            },
          },
        },
      },
    );

    if (!valid) throw new NotFoundException('Attendance doesnot exist');

    return valid;
  }

  async getStaffLogs({
    user,
    startDate,
    endDate,
  }: AssignedUserParam.GetAll & {
    startDate?: moment.Moment;
    endDate?: moment.Moment;
  }) {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        gte: startDate.toDate(),
      };
    }
    if (endDate) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        lte: endDate.endOf('day').toDate(),
      };
    }

    const [checkIns, checkOuts] = await Promise.all([
      this.prisma.checkInOut.existMany(user.apartmentId, {
        where: {
          requestType: 'clientstaff',
          type: 'checkin',
          flats: { some: { id: user.flatId } },
          ...dateFilter,
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          clientStaffId: true,
          clientStaff: {
            select: {
              name: true,
              contact: true,
              image: { select: { url: true } },
              personalStaffRole: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.checkInOut.existMany(user.apartmentId, {
        where: {
          requestType: 'clientstaff',
          type: 'checkout',
          flats: { some: { id: user.flatId } },
          ...dateFilter,
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          clientStaffId: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const logs = this.pairLogs(checkIns, checkOuts);
    return logs;
  }

  private pairLogs(checkIns: any[], checkOuts: any[]): any[] {
    const pairedLogs = checkIns.map((checkIn) => {
      const checkOut = checkOuts.find(
        (co) =>
          co.clientStaffId === checkIn.clientStaffId &&
          moment(co.createdAt).isAfter(checkIn.createdAt),
      );

      return {
        name: checkIn.clientStaff.name,
        role: checkIn.clientStaff.personalStaffRole.name,
        imageUrl: checkIn.clientStaff.image.url,
        enteredAt: checkIn.createdAt,
        exitedAt: checkOut ? checkOut.createdAt : null,
      };
    });

    pairedLogs.sort((a, b) => moment(b.enteredAt).diff(moment(a.enteredAt)));

    return pairedLogs;
  }
}
