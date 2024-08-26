import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { CreateParams } from '../../common/interface';
import { GuardUser } from '@prisma/client';
import { AttendanceService } from 'src/global/attendance/attendance.service';
import moment from 'moment';

@Injectable()
export class ClockInOutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: AttendanceService,
  ) {}

  async clockInOutGuard(data: { id: string } & CreateParams<undefined>) {
    const { apartmentId, id } = data;

    const valid = await this.prisma.guardUser.findUnique({
      where: { id, apartmentId, archive: false },
    });

    if (!valid) throw new NotFoundException('Guard does not exist');

    const shift = await this.prisma.guardShift.findFirst({
      where: { id: valid.shiftId },
    });

    if (!shift) throw new NotFoundException('Shift does not exist');

    const surveillance = await this.prisma.surveillance.exists(apartmentId, {
      where: {
        id: valid.surveillanceId,
      },
    });

    if (!surveillance)
      throw new NotFoundException('Surveillance does not exist');

    const { date, clockedTime } = this.attendance.createAttendanceDetails();

    const attendance = await this.prisma.guardAttendance.exists(apartmentId, {
      where: {
        date,
        userId: valid.id,
      },
      include: {
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    let clockStatus = '';

    if (attendance) {
      if (attendance.events.length === 0) {
        await this.prisma.guardClockedEvent.create({
          data: {
            attendanceId: attendance.id,
            clockedInTime: clockedTime,
            clockedIn: true,
            surveillanceName: surveillance.name,
          },
        });

        clockStatus = 'in';
      } else {
        // when there is attendance and events
        if (!attendance.events[0].clockedOut) {
          const duration = this.attendance.calculateTimeDifferenceFormatted(
            moment(attendance.events[0].clockedInTime),
            moment(clockedTime),
          );
          await this.prisma.guardClockedEvent.update({
            where: {
              id: attendance.events[0].id,
            },
            data: {
              clockedOutTime: clockedTime,
              clockedOut: true,
              duration,
            },
          });

          clockStatus = 'out';
        } else {
          await this.prisma.guardClockedEvent.create({
            data: {
              attendanceId: attendance.id,
              clockedInTime: clockedTime,
              clockedIn: true,
              surveillanceName: surveillance.name,
            },
          });

          clockStatus = 'in';
        }
      }
    } else {
      await this.prisma.guardAttendance.create({
        data: {
          userId: valid.id,
          date,
          apartmentId,
          shiftName: shift.name,
          shiftStartTime: shift.start,
          shiftEndTime: shift.end,
          events: {
            create: {
              clockedInTime: clockedTime,
              clockedIn: true,
              surveillanceName: surveillance.name,
            },
          },
        },
      });

      clockStatus = 'in';
    }

    return `Your clock ${clockStatus} for today is recorded`;
  }

  async clockInOutClientStaff(props: {
    id: string;
    apartmentId: string;
    loggedUserData: GuardUser;
    in: boolean;
  }) {
    const { id, loggedUserData, apartmentId, in: isClockingIn } = props;

    const { date, clockedTime } = this.attendance.createAttendanceDetails();

    const surveillance = await this.prisma.surveillance.exists(apartmentId, {
      where: {
        id: loggedUserData.surveillanceId,
      },
    });

    if (!surveillance) return 'Invalid surveillance';

    const attendance = await this.prisma.clientStaffAttendance.exists(
      apartmentId,
      {
        where: {
          date,
          userId: id,
        },
        include: {
          events: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    );

    if (!attendance) {
      if (!isClockingIn) return 'Cannot clock out without clocking in first';

      await this.prisma.clientStaffAttendance.create({
        data: {
          userId: id,
          date,
          apartmentId,
          events: {
            create: {
              clockedInTime: clockedTime,
              clockedIn: true,
              surveillanceName: surveillance.name,
            },
          },
        },
      });

      return 'Your clock in for today is recorded';
    }

    const lastEvent = attendance.events[0];

    if (isClockingIn) {
      if (lastEvent && !lastEvent.clockedOut) {
        return 'You are already clocked in';
      }

      await this.prisma.clientStaffClockedEvent.create({
        data: {
          attendanceId: attendance.id,
          clockedInTime: clockedTime,
          clockedIn: true,
          surveillanceName: surveillance.name,
        },
      });
      return 'Your clock in for today is recorded';
    } else {
      if (!lastEvent || lastEvent.clockedOut) {
        return 'You need to clock in first';
      }

      const duration = this.attendance.calculateTimeDifferenceFormatted(
        moment(lastEvent.clockedInTime),
        moment(clockedTime),
      );

      await this.prisma.clientStaffClockedEvent.update({
        where: {
          id: lastEvent.id,
        },
        data: {
          clockedOutTime: clockedTime,
          clockedOut: true,
          duration,
        },
      });

      return 'Your clock out for today is recorded';
    }
  }

  async clockInOutAdminService(props: {
    id: string;
    apartmentId: string;
    loggedUserData: GuardUser;
    in?: boolean;
  }) {
    const { id, loggedUserData, apartmentId, in: isClockingIn } = props;

    const serviceStaff = await this.prisma.adminService.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!serviceStaff) throw new NotFoundException('Service Staff not found');

    const shift = await this.prisma.adminServiceShift.findFirst({
      where: { id: serviceStaff.shiftId },
    });

    if (!shift) return;

    const surveillance = await this.prisma.surveillance.exists(apartmentId, {
      where: {
        id: loggedUserData.surveillanceId,
      },
    });

    if (!surveillance) return;

    const { date, clockedTime } = this.attendance.createAttendanceDetails();

    const attendance = await this.prisma.adminServiceAttendance.exists(
      apartmentId,
      {
        where: {
          date,
          userId: id,
        },
        include: {
          events: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    );

    if (!attendance) {
      if (!isClockingIn) return 'Cannot clock out without clocking in first';

      await this.prisma.adminServiceAttendance.create({
        data: {
          userId: id,
          date,
          apartmentId,
          shiftName: shift.name,
          shiftStartTime: shift.start,
          shiftEndTime: shift.end,
          events: {
            create: {
              clockedInTime: clockedTime,
              clockedIn: true,
              surveillanceName: surveillance.name,
            },
          },
        },
      });
      return 'Your clock in for today is recorded';
    }

    const lastEvent = attendance.events[0];

    if (isClockingIn) {
      if (lastEvent && !lastEvent.clockedOut) {
        // Missing clock-out from previous shift
        // const estimatedEndTime = moment(lastEvent.clockedInTime).add(8, 'hours'); // Assume 8-hour shift
        // await this.prisma.adminServiceClockedEvent.update({
        //   where: {
        //     id: lastEvent.id,
        //   },
        //   data: {
        //     clockedOutTime: estimatedEndTime.toDate(),
        //     clockedOut: true,
        //     duration: this.attendance.calculateTimeDifferenceFormatted(
        //       moment(lastEvent.clockedInTime),
        //       estimatedEndTime
        //     ),
        //     irregularity: 'Missing clock-out',
        //   },
        // });
        return 'You are already clocked in';
      }

      await this.prisma.adminServiceClockedEvent.create({
        data: {
          attendanceId: attendance.id,
          clockedInTime: clockedTime,
          clockedIn: true,
          surveillanceName: surveillance.name,
        },
      });
      return 'Your clock in for today is recorded';
    } else {
      if (!lastEvent || lastEvent.clockedOut) {
        return 'You need to clock in first';
      }

      const duration = this.attendance.calculateTimeDifferenceFormatted(
        moment(lastEvent.clockedInTime),
        moment(clockedTime),
      );

      await this.prisma.adminServiceClockedEvent.update({
        where: {
          id: lastEvent.id,
        },
        data: {
          clockedOutTime: clockedTime,
          clockedOut: true,
          duration,
        },
      });

      return 'Your clock out for today is recorded';
    }
  }

  async clockInOutAdmin(data: { id: string } & CreateParams<undefined>) {
    const { apartmentId, loggedUserData, id } = data;

    const valid = await this.prisma.adminUser.findUnique({
      where: { id, apartmentId, archive: false },
    });

    if (!valid) throw new NotFoundException('Admin does not exist');

    if (!valid.shiftId)
      throw new NotFoundException('Shift does not exist for this admin');

    const shift = await this.prisma.adminShift.findFirst({
      where: { id: valid.shiftId },
    });

    if (!shift) throw new NotFoundException('Shift does not exist');

    const surveillance = await this.prisma.surveillance.exists(apartmentId, {
      where: {
        id: loggedUserData.surveillanceId,
      },
      select: { name: true },
    });

    if (!surveillance)
      throw new NotFoundException('Surveillance does not exist');

    const { date, clockedTime } = this.attendance.createAttendanceDetails();

    const attendance = await this.prisma.adminAttendance.exists(apartmentId, {
      where: {
        date,
        userId: valid.id,
      },
      include: {
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (attendance) {
      if (attendance.events.length === 0) {
        await this.prisma.adminClockedEvent.create({
          data: {
            attendanceId: attendance.id,
            clockedInTime: clockedTime,
            clockedIn: true,
            surveillanceName: surveillance.name,
          },
        });

        return;
      }

      // when there is attendance and events
      if (!attendance.events[0].clockedOut) {
        const duration = this.attendance.calculateTimeDifferenceFormatted(
          moment(attendance.events[0].clockedInTime),
          moment(clockedTime),
        );
        await this.prisma.adminClockedEvent.update({
          where: {
            id: attendance.events[0].id,
          },
          data: {
            clockedOutTime: clockedTime,
            clockedOut: true,
            duration,
          },
        });

        return;
      }

      await this.prisma.adminClockedEvent.create({
        data: {
          attendanceId: attendance.id,
          clockedInTime: clockedTime,
          clockedIn: true,
          surveillanceName: surveillance.name,
        },
      });

      return;
    }

    await this.prisma.adminAttendance.create({
      data: {
        userId: valid.id,
        date,
        apartmentId,
        shiftName: shift.name,
        shiftStartTime: shift.start,
        shiftEndTime: shift.end,
        events: {
          create: {
            clockedInTime: clockedTime,
            clockedIn: true,
            surveillanceName: surveillance.name,
          },
        },
      },
    });

    return '';
  }
}
