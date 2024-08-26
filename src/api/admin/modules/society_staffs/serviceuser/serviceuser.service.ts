import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from 'src/api/admin/common/interface/admin.interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createServiceUserDto } from './dtos/create-serviceuser.dto';
import { updateServiceUserDto } from './dtos/update-serviceuser.dto';
import { FileService } from 'src/global/file/file.service';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { encrypt, decrypt } from 'src/common/utils/crypto';
import { AttendanceService } from 'src/global/attendance/attendance.service';
import moment from 'moment';
import { getTimeDifference } from 'src/common/utils/time-difference';
import { createUpdateAttendanceDto } from '../guarduser/dtos/create-updateAttendance.dto';
import { capitalize } from 'lodash';

@Injectable()
export class ServiceUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly activityService: AdminActivityService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async create(data: CreateParams<createServiceUserDto>) {
    const { name, contact, roleId, shiftId, ...postData } = data.postData;
    const { loggedUserData, apartmentId } = data;

    const alreadyExist = await this.prisma.adminService.findFirst({
      where: {
        contact,
      },
    });

    if (alreadyExist) throw new BadRequestException('Contact already exists');

    const validRole = await this.prisma.adminServiceRole.exists(apartmentId, {
      where: {
        id: roleId,
        archive: false,
      },
    });

    if (!validRole) throw new BadRequestException('Role does not exists');

    const validShift = await this.prisma.adminServiceShift.exists(apartmentId, {
      where: {
        id: shiftId,
        archive: false,
      },
    });

    if (!validShift) throw new BadRequestException('Shift does not exists');

    const passcode = encrypt(postData.passcode);

    const user = await this.prisma.adminService.create({
      data: {
        ...postData,
        passcode,
        name,
        contact,
        roleId,
        shiftId,
        apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
        gatePass: {
          create: {
            code: postData.passcode,
            apartmentId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        contact: true,
        gatePass: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Created service staff ${user.name}`,
      type: 'serviceuser',
    });

    return user;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const users = await this.prisma.adminService.existMany(apartmentId, {
      where: {
        archive,
      },
      orderBy: {
        createdById: 'desc',
      },
      select: {
        id: true,
        name: true,
        gender: true,
        contact: true,
        bloodgroup: true,
        passcode: true,
        dob: true,
        role: {
          select: {
            name: true,
          },
        },
        image: {
          select: {
            url: true,
          },
        },
        shift: {
          select: {
            name: true,
            start: true,
            end: true,
          },
        },
      },
    });

    return users.map((user) => {
      return {
        ...user,
        passcode: decrypt(user.passcode),
      };
    });
  }

  async getSingle(data: GetParam) {
    const { apartmentId, id } = data;

    const user = await this.prisma.adminService.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        name: true,
        contact: true,
        dob: true,
        passcode: true,
        gender: true,
        archive: true,
        bloodgroup: true,
        image: {
          select: {
            url: true,
          },
        },
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        shiftId: true,
        shift: {
          select: {
            name: true,
            start: true,
            end: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      passcode: decrypt(user.passcode),
    };
  }

  async getAllAttendance(
    data: GetAllParams & {
      start: Date;
      end: Date;
      type: 'daily' | 'monthly' | 'yearly';
      date: string;
    },
  ) {
    const { start, end, type, apartmentId, date } = data;

    const serviceStaffs = await this.prisma.adminService.existMany(
      apartmentId,
      {
        where: {
          archive: false,
          createdAt: {
            lt: end,
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          role: {
            select: {
              name: true,
            },
          },
          image: {
            select: {
              url: true,
            },
          },
          shift: {
            select: {
              name: true,
              start: true,
              end: true,
            },
          },
        },
      },
    );

    if (type === 'daily') {
      const attendances = await Promise.all(
        serviceStaffs.map(async (item) => {
          const attendance =
            await this.prisma.adminServiceAttendance.findUnique({
              where: {
                dateIdentifier: {
                  userId: item.id,
                  date,
                },
              },
              select: {
                events: true,
              },
            });

          return {
            ...item,
            attendance,
          };
        }),
      );

      return attendances;
    } else if (type === 'monthly') {
      const today = moment();
      const noOfDaysInMonth = moment(date, 'YYYY-MM').isSame(today, 'month')
        ? today.date()
        : moment(date, 'YYYY-MM').daysInMonth();

      const attendances = await Promise.all(
        serviceStaffs.map(async (item) => {
          const attendance = await this.prisma.adminServiceAttendance.count({
            where: {
              userId: item.id,
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          });

          const ifCreatedSameYear = moment(date, 'YYYY').isSame(
            item.createdAt,
            'year',
          );

          const ifCreatedSameMonth = moment(date, 'YYYY-MM').isSame(
            item.createdAt,
            'month',
          );

          const createdAt = moment(item.createdAt);

          const noOfDays =
            ifCreatedSameYear && ifCreatedSameMonth
              ? today.diff(createdAt, 'days') + 1
              : noOfDaysInMonth;

          return {
            ...item,
            present: attendance,
            absent: noOfDays - attendance,
          };
        }),
      );

      return attendances;
    } else {
      const today = moment();
      const noOfDaysInYear = moment(date, 'YYYY').isSame(today, 'year')
        ? today.dayOfYear()
        : moment(date, 'YYYY').isLeapYear()
          ? 366
          : 365;

      const attendances = await Promise.all(
        serviceStaffs.map(async (item) => {
          const attendance = await this.prisma.adminServiceAttendance.count({
            where: {
              userId: item.id,
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          });

          const ifCreatedSameYear = moment(date, 'YYYY').isSame(
            item.createdAt,
            'year',
          );

          const createdAt = moment(item.createdAt);

          const noOfDays = ifCreatedSameYear
            ? today.diff(createdAt, 'days') + 1
            : noOfDaysInYear;

          return {
            ...item,
            present: attendance,
            absent: noOfDays - attendance,
          };
        }),
      );

      return attendances;
    }
  }

  async getSingleAttendance(
    data: GetParam & {
      start: Date;
      end: Date;
      type: 'daily' | 'monthly' | 'yearly';
      date: string;
    },
  ) {
    const { id, apartmentId, type, date } = data;

    const valid = await this.prisma.adminService.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('User does not exists');

    if (type === 'yearly') {
      const yearData = this.attendanceService.getAllMonthsInYear(date);

      const attendances = await Promise.all(
        yearData.map(async (item) => {
          const today = moment();
          const noOfDaysInMonth = moment(item.start, 'YYYY-MM').isSame(
            today,
            'month',
          )
            ? today.date()
            : moment(item.start, 'YYYY-MM').daysInMonth();

          if (item.start > new Date()) {
            return {
              month: item.month,
              present: null,
              absent: null,
            };
          }

          if (item.end < valid.createdAt) {
            return {
              month: item.month,
              present: null,
              absent: null,
            };
          }
          const counts = await this.prisma.adminServiceAttendance.count({
            where: {
              userId: id,
              createdAt: {
                gte: item.start,
                lte: item.end,
              },
            },
          });

          const ifCreatedSameYear = moment(item.start, 'YYYY').isSame(
            valid.createdAt,
            'year',
          );

          const ifCreatedSameMonth = moment(item.start, 'YYYY-MM').isSame(
            valid.createdAt,
            'month',
          );

          const createdAt = moment(valid.createdAt);

          const noOfDays =
            ifCreatedSameYear && ifCreatedSameMonth
              ? today.diff(createdAt, 'days') + 1
              : noOfDaysInMonth;

          return {
            ...item,
            present: counts,
            absent: noOfDays - counts,
          };
        }),
      );

      return attendances;
    } else if (type === 'monthly') {
      const monthData = this.attendanceService.getAllDaysinMonth(date);

      const attendances = await this.prisma.adminServiceAttendance.findMany({
        where: {
          userId: id,
          createdAt: {
            gte: monthData.startOfMonth,
            lte: monthData.endOfMonth,
          },
        },
        select: {
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

      const monthAttendance = monthData.days.map((item) => {
        const attendance = attendances.find((i) => i.date === item.date);

        if (valid.createdAt > moment(item.date).endOf('day').toDate()) {
          return undefined;
        }

        if (attendance) {
          return {
            ...item,
            present: true,
            ...attendance,
          };
        }
        return {
          ...item,
          present: false,
          events: [],
        };
      });

      return monthAttendance.filter((item) => item);
    } else {
      return [];
    }
  }

  async createOrUpdateAttendance(
    data: CreateParams<createUpdateAttendanceDto>,
  ) {
    const { apartmentId } = data;

    const { eventId, date, clockedIn, clockedOut, userId } = data.postData;

    const validUser = await this.prisma.adminService.exists(apartmentId, {
      where: {
        id: userId,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    if (eventId) {
      const validEvent = await this.prisma.adminServiceClockedEvent.findUnique({
        where: {
          id: eventId,
          attendance: {
            apartmentId,
            userId,
          },
        },
        include: {
          attendance: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!validEvent) throw new NotFoundException('Event not found');

      await this.prisma.adminServiceClockedEvent.update({
        where: {
          id: eventId,
        },
        data: {
          clockedInTime: clockedIn,
          clockedOutTime: clockedOut,
          duration: getTimeDifference(clockedIn, clockedOut),
        },
      });

      await this.activityService.create({
        loggedUserData: data.loggedUserData,
        message: `Updated attendance for ${capitalize(validUser.name)}`,
        type: 'service-attendance',
      });

      return;
    }

    const existAttendance = await this.prisma.adminServiceAttendance.exists(
      apartmentId,
      {
        where: {
          userId,
          date,
        },
      },
    );

    if (existAttendance) {
      await this.prisma.adminServiceClockedEvent.create({
        data: {
          clockedInTime: clockedIn,
          clockedOutTime: clockedOut,
          duration: getTimeDifference(clockedIn, clockedOut),
          attendanceId: existAttendance.id,
          clockedIn: true,
          clockedOut: true,
          surveillanceName: 'society admin',
        },
      });

      await this.activityService.create({
        loggedUserData: data.loggedUserData,
        message: `Created attendance for ${capitalize(validUser.name)}`,
        type: 'service-attendance',
      });

      return;
    }

    await this.prisma.adminServiceAttendance.create({
      data: {
        shiftName: 'society admin',
        shiftStartTime: new Date(),
        shiftEndTime: new Date(),
        date,
        apartmentId,
        userId,
        events: {
          create: {
            clockedInTime: clockedIn,
            clockedOutTime: clockedOut,
            duration: getTimeDifference(clockedIn, clockedOut),
            clockedIn: true,
            clockedOut: true,
            surveillanceName: 'society admin',
          },
        },
      },
    });

    await this.activityService.create({
      loggedUserData: data.loggedUserData,
      message: `Created attendance for ${capitalize(validUser.name)}`,
      type: 'service-attendance',
    });
  }

  async update(data: UpdateParams<updateServiceUserDto>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    const validUser = await this.prisma.adminService.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    if (postData.roleId && postData.roleId !== validUser.roleId) {
      const validRole = await this.prisma.adminServiceRole.exists(apartmentId, {
        where: {
          id: postData.roleId,
        },
      });

      if (!validRole) throw new BadRequestException('Role does not exists');
    }

    if (postData.shiftId && postData.shiftId !== validUser.shiftId) {
      const validShift = await this.prisma.adminServiceShift.exists(
        apartmentId,
        {
          where: {
            id: postData.shiftId,
          },
        },
      );

      if (!validShift) throw new BadRequestException('Shift does not exists');
    }

    const user = await this.prisma.adminService.update({
      where: {
        id,
      },
      data: {
        ...postData,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Updated service staff ${user.name}`,
      type: 'serviceuser',
    });

    return user;
  }

  async upload(data: UpdateParams<Express.Multer.File>) {
    const { id, apartmentId, postData } = data;

    const validUser = await this.prisma.adminService.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        image: true,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const file = await this.fileService.createOrUpdate({
      file: postData,
      type: 'image',
      existedFile: validUser.image ? validUser.image : undefined,
    });

    const profile = await this.prisma.adminService.update({
      where: {
        id,
      },
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

    return profile;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, apartmentId, loggedUserData } = data;

    const validUser = await this.prisma.adminService.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const user = await this.prisma.adminService.update({
      where: {
        id,
      },
      data: {
        archive: !validUser.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `${user.archive ? 'Archived' : 'Restored'} service staff ${user.name}`,
      type: 'serviceuser',
    });

    return user;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const validUser = await this.prisma.adminService.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const user = await this.prisma.adminService.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted service staff ${user.name}`,
      type: 'serviceuser',
    });

    return user;
  }
}
