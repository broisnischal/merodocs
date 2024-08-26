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
import { createGuardUserDto } from './dtos/create-guarduser.dto';
import { updateGuardUserDto } from './dtos/update-guarduser.dto';
import { FileService } from 'src/global/file/file.service';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { encrypt, decrypt } from 'src/common/utils/crypto';
import { AttendanceService } from 'src/global/attendance/attendance.service';
import moment from 'moment';
import { createUpdateAttendanceDto } from './dtos/create-updateAttendance.dto';
import { getTimeDifference } from 'src/common/utils/time-difference';
import { capitalize } from 'lodash';

@Injectable()
export class GuardUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly activityService: AdminActivityService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async create(data: CreateParams<createGuardUserDto>) {
    const { name, username, surveillanceId, ...postData } = data.postData;
    const { loggedUserData, apartmentId } = data;

    if (surveillanceId) {
      const valid = await this.prisma.surveillance.exists(apartmentId, {
        where: {
          id: surveillanceId,
          archive: false,
        },
      });

      if (!valid) throw new BadRequestException('SurveillanceId is invalid');
    }

    if (postData.shiftId) {
      const validShift = await this.prisma.guardShift.exists(apartmentId, {
        where: {
          id: postData.shiftId,
          archive: false,
        },
      });

      if (!validShift) throw new BadRequestException('ShiftId is invalid');
    }

    const alreadyExist = await this.prisma.guardUser.findUnique({
      where: {
        username,
        archive: false,
      },
    });

    if (alreadyExist) throw new BadRequestException('Username already exist');

    const passcode = encrypt(postData.passcode);

    const user = await this.prisma.guardUser.create({
      data: {
        ...postData,
        name,
        username,
        passcode,
        apartmentId,
        surveillanceId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
      select: {
        id: true,
        name: true,
        contact: true,
        email: true,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Created guard ${user.name}`,
      type: 'guarduser',
    });

    return user;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const users = await this.prisma.guardUser.existMany(apartmentId, {
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
        username: true,
        email: true,
        passcode: true,
        shift: {
          select: {
            name: true,
            start: true,
            end: true,
          },
        },
        surveillance: {
          select: {
            name: true,
          },
        },
        dob: true,
        image: {
          select: {
            url: true,
          },
        },
        bloodgroup: true,
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

    const user = await this.prisma.guardUser.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        name: true,
        contact: true,
        username: true,
        email: true,
        passcode: true,
        shiftId: true,
        surveillanceId: true,
        shift: {
          select: {
            name: true,
            start: true,
            end: true,
          },
        },
        surveillance: {
          select: {
            name: true,
          },
        },
        dob: true,
        gender: true,
        bloodgroup: true,
        image: {
          select: {
            url: true,
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

    const guards = await this.prisma.guardUser.existMany(apartmentId, {
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
        surveillance: {
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

    if (type === 'daily') {
      const attendances = await Promise.all(
        guards.map(async (item) => {
          const attendance = await this.prisma.guardAttendance.findUnique({
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
        guards.map(async (item) => {
          const attendance = await this.prisma.guardAttendance.count({
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
        guards.map(async (item) => {
          const attendance = await this.prisma.guardAttendance.count({
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

    const valid = await this.prisma.guardUser.exists(apartmentId, {
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
          const counts = await this.prisma.guardAttendance.count({
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

      const attendances = await this.prisma.guardAttendance.findMany({
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

    const validUser = await this.prisma.guardUser.exists(apartmentId, {
      where: {
        id: userId,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    if (eventId) {
      const validEvent = await this.prisma.guardClockedEvent.findUnique({
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

      await this.prisma.guardClockedEvent.update({
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
        type: 'guard-attendance',
      });

      return;
    }

    const existAttendance = await this.prisma.guardAttendance.exists(
      apartmentId,
      {
        where: {
          userId,
          date,
        },
      },
    );

    if (existAttendance) {
      await this.prisma.guardClockedEvent.create({
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
        type: 'guard-attendance',
      });

      return;
    }

    await this.prisma.guardAttendance.create({
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
      type: 'guard-attendance',
    });
  }

  async update(data: UpdateParams<updateGuardUserDto>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    const validUser = await this.prisma.guardUser.exists(apartmentId, {
      where: {
        id,
        archive: false,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const { username } = postData;

    if (username !== validUser.username) {
      const alreadyExist = await this.prisma.guardUser.findUnique({
        where: {
          username,
          archive: false,
        },
      });

      if (alreadyExist)
        throw new BadRequestException('Username already exists');
    }

    if (
      postData.surveillanceId &&
      postData.surveillanceId !== validUser.surveillanceId
    ) {
      const surveillance = await this.prisma.surveillance.exists(apartmentId, {
        where: {
          id: postData.surveillanceId,
          archive: false,
        },
      });

      if (!surveillance)
        throw new BadRequestException('Surveillance is invalid');
    }

    if (postData.shiftId && postData.shiftId !== validUser.shiftId) {
      const validShift = await this.prisma.guardShift.exists(apartmentId, {
        where: {
          id: postData.shiftId,
          archive: false,
        },
      });

      if (!validShift) throw new BadRequestException('ShiftId is invalid');
    }

    const user = await this.prisma.guardUser.update({
      where: {
        id,
      },
      data: {
        ...postData,
        passcode: postData.passcode && encrypt(postData.passcode),
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Updated guard ${user.name}`,
      type: 'guarduser',
    });

    return {
      ...user,
      passcode: decrypt(user.passcode),
    };
  }

  async upload(data: UpdateParams<Express.Multer.File>) {
    const { id, apartmentId, postData } = data;

    const validUser = await this.prisma.guardUser.exists(apartmentId, {
      where: {
        id,
        archive: false,
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

    const profile = await this.prisma.guardUser.update({
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

    const validUser = await this.prisma.guardUser.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const user = await this.prisma.guardUser.update({
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
      message: `${user.archive ? 'Archived' : 'Restored'} guard ${user.name}`,
      type: 'guarduser',
    });

    return user;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const validUser = await this.prisma.guardUser.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    await this.prisma.guardUser.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted guard ${validUser.name}`,
      type: 'guarduser',
    });
  }
}
