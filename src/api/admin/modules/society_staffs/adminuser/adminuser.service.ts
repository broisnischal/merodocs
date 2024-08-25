import {
  BadRequestException,
  ForbiddenException,
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
import bcrypt from 'bcryptjs';
import { createAdminUserDto } from './dtos/create-adminuser.dto';
import { updateAdminUserDto } from './dtos/update-adminuser.dto';
import { FileService } from 'src/global/file/file.service';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { capitalize } from 'lodash';
import { getTimeDifference } from 'src/common/utils/time-difference';
import { createUpdateAttendanceDto } from '../guarduser/dtos/create-updateAttendance.dto';
import moment from 'moment';
import { AttendanceService } from 'src/global/attendance/attendance.service';

@Injectable()
export class AdminUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly activityService: AdminActivityService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async create(data: CreateParams<createAdminUserDto>) {
    const { cpassword, name, email, ...postData } = data.postData;
    const { loggedUserData, apartmentId } = data;

    const validRole = await this.prisma.adminRole.exists(apartmentId, {
      where: {
        id: postData.roleId,
        archive: false,
      },
    });

    if (!validRole) throw new BadRequestException('Invalid Role Id');

    if (postData.shiftId) {
      const validShift = await this.prisma.adminShift.exists(apartmentId, {
        where: {
          id: postData.shiftId,
          archive: false,
        },
      });

      if (!validShift) throw new BadRequestException('ShiftId is invalid');
    }

    const alreadyExist = await this.prisma.adminUser.findUnique({
      where: {
        email,
      },
    });

    if (alreadyExist) throw new BadRequestException('Email already exist');

    if (postData.password !== cpassword)
      throw new BadRequestException('Password are not same');

    const password = bcrypt.hashSync(postData.password, 10);

    const user = await this.prisma.adminUser.create({
      data: {
        ...postData,
        name,
        email,
        password,
        apartmentId,
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
      message: `Created user ${user.name}`,
      type: 'adminuser',
    });

    return user;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const users = await this.prisma.adminUser.existMany(apartmentId, {
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
        dob: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            start: true,
            end: true,
          },
        },
        image: {
          select: {
            url: true,
          },
        },
      },
    });

    return users;
  }

  async getSingle(data: GetParam) {
    const { apartmentId, id } = data;

    const user = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        name: true,
        contact: true,
        email: true,
        dob: true,
        gender: true,
        bloodgroup: true,
        image: {
          select: {
            url: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            start: true,
            end: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
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

    const adminStaffs = await this.prisma.adminUser.existMany(apartmentId, {
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
    });

    if (type === 'daily') {
      const attendances = await Promise.all(
        adminStaffs.map(async (item) => {
          const attendance = await this.prisma.adminAttendance.findUnique({
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
        adminStaffs.map(async (item) => {
          const attendance = await this.prisma.adminAttendance.count({
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
        adminStaffs.map(async (item) => {
          const attendance = await this.prisma.adminAttendance.count({
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

    const valid = await this.prisma.adminUser.exists(apartmentId, {
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
          const counts = await this.prisma.adminAttendance.count({
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

      const attendances = await this.prisma.adminAttendance.findMany({
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

    const validUser = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        id: userId,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    if (eventId) {
      const validEvent = await this.prisma.adminClockedEvent.findUnique({
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

      await this.prisma.adminClockedEvent.update({
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
        type: 'admin-attendance',
      });

      return;
    }

    const existAttendance = await this.prisma.adminAttendance.exists(
      apartmentId,
      {
        where: {
          userId,
          date,
        },
      },
    );

    if (existAttendance) {
      await this.prisma.adminClockedEvent.create({
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
        type: 'admin-attendance',
      });

      return;
    }

    await this.prisma.adminAttendance.create({
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
      type: 'admin-attendance',
    });
  }

  async update(data: UpdateParams<updateAdminUserDto>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    const { email, roleId } = postData;

    const validUser = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    //check superadmin
    const apartment = await this.prisma.apartment.findUnique({
      where: {
        id: apartmentId,
      },
    });

    const isSuperadmin = validUser.email === apartment?.mainUser;

    if (isSuperadmin && validUser.id !== loggedUserData.id) {
      throw new ForbiddenException(
        'Only the superadmin can update their own profile',
      );
    }

    if (postData.shiftId && postData.shiftId !== validUser.shiftId) {
      const validShift = await this.prisma.adminShift.exists(apartmentId, {
        where: {
          id: postData.shiftId,
          archive: false,
        },
      });

      if (!validShift) throw new BadRequestException('ShiftId is invalid');
    }

    if (email !== validUser.email) {
      const alreadyExist = await this.prisma.adminUser.findUnique({
        where: {
          email,
          archive: false,
          NOT: {
            id,
          },
        },
      });

      if (alreadyExist) throw new BadRequestException('Email already exists');
    }

    if (roleId !== validUser.roleId) {
      const validRole = await this.prisma.adminRole.exists(apartmentId, {
        where: {
          id: roleId,
          archive: false,
        },
      });

      if (!validRole) throw new BadRequestException('Invalid Role Id');
    }

    const user = await this.prisma.adminUser.update({
      where: {
        id,
      },
      data: {
        ...postData,
        email: isSuperadmin ? undefined : email,
        shiftId: isSuperadmin ? undefined : postData.shiftId,
        roleId: isSuperadmin ? undefined : roleId,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Updated user ${user.name}`,
      type: 'adminuser',
    });

    return user;
  }

  async upload(data: UpdateParams<Express.Multer.File>) {
    const { id, apartmentId, postData } = data;

    const validUser = await this.prisma.adminUser.exists(apartmentId, {
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

    const profile = await this.prisma.adminUser.update({
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

    const validUser = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    if (validUser.id === loggedUserData.id)
      throw new ForbiddenException('Cannot archive your own account');

    const apartment = await this.prisma.apartment.findUnique({
      where: {
        id: apartmentId,
      },
    });

    const isSuperadmin = validUser.email === apartment?.mainUser;

    if (isSuperadmin) {
      throw new ForbiddenException('Superadmin account cannot be archived');
    }

    const user = await this.prisma.adminUser.update({
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
      message: `${user.archive ? 'Archived' : 'Restored'} adminuser ${user.name}`,
      type: 'adminuser',
    });

    return user;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const validUser = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    if (validUser.id === loggedUserData.id)
      throw new ForbiddenException('Cannot delete your own account');

    const apartment = await this.prisma.apartment.findUnique({
      where: {
        id: apartmentId,
      },
    });

    const isSuperadmin = validUser.email === apartment!.mainUser;

    if (isSuperadmin) {
      throw new ForbiddenException('Superadmin account cannot be deleted');
    }

    await this.prisma.adminUser.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted user ${validUser.name}`,
      type: 'adminuser',
    });
  }
}
