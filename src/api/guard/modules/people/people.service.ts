import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams, GetParam } from '../../common/interface';
import { AttendanceService } from 'src/global/attendance/attendance.service';
import moment from 'moment';
import { getTimeDifferenceInHrsMins } from 'src/common/utils/time-difference';

@Injectable()
export class PeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: AttendanceService,
  ) {}

  async getAllCount(data: GetAllParams) {
    const { apartmentId } = data;

    const [residents, residentStaffs, societyStaffs, guards, management] =
      await Promise.all([
        this.prisma.flatCurrentClient.count({ where: { apartmentId } }),
        this.prisma.clientStaff.count({
          where: { apartmentId, archive: false, status: 'approved' },
        }),
        this.prisma.adminService.count({
          where: { apartmentId, archive: false },
        }),
        this.prisma.guardUser.count({
          where: { apartmentId, archive: false },
        }),
        this.prisma.adminUser.count({
          where: { apartmentId, archive: false },
        }),
      ]);

    return { residents, residentStaffs, societyStaffs, guards, management };
  }

  async getResidentsBlock(data: GetAllParams) {
    const { apartmentId, q } = data;

    const blocks = await this.prisma.block.findMany({
      where: {
        apartmentId,
        archive: false,
        name: {
          contains: q || undefined,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return blocks;
  }

  async getResidentsList(data: GetParam) {
    const { id, apartmentId, q } = data;

    const valid = await this.prisma.block.findFirst({
      where: {
        id,
        archive: false,
      },
    });

    if (!valid) throw new NotFoundException('Block does not exist');

    const flats = await this.prisma.flat.findMany({
      where: {
        apartmentId,
        floor: {
          blockId: id,
        },
        archive: false,
      },
      select: {
        id: true,
        name: true,
        currentClients: {
          where: {
            clientUser: {
              name: q && {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
          select: {
            type: true,
            clientUser: {
              select: {
                id: true,
                image: { select: { url: true } },
                name: true,
                contact: true,
              },
            },
          },
        },
      },
    });

    const blocks = flats.map((flat) => ({
      flat: {
        ...flat,
        clientUsers: flat.currentClients.map((i) => ({
          ...i.clientUser,
          type: i.type,
        })),
        currentClients: undefined,
      },
    }));

    return blocks;
  }

  async getResidentsByFlatId(data: GetParam) {
    const { id, apartmentId } = data;

    const valid = await this.prisma.flat.findFirst({
      where: {
        id,
        archive: false,
      },
    });

    if (!valid) throw new NotFoundException('Flat does not exist');

    const clients = await this.prisma.flatCurrentClient.findMany({
      where: {
        flat: { id },
        apartmentId,
      },
      select: {
        type: true,
        clientUser: {
          select: {
            id: true,
            image: { select: { url: true } },
            name: true,
            contact: true,
          },
        },
      },
    });

    return clients;
  }

  async getResidentsById(data: GetParam) {
    const { id, apartmentId } = data;

    const user = await this.prisma.clientUser.findUnique({
      where: {
        id,
        archive: false,
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        contact: true,
        family: true,
        clientApartments: {
          where: {
            status: 'approved',
          },
          select: {
            id: true,
            type: true,
            flat: {
              select: {
                name: true,
                floor: { select: { block: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User doesnot exist');

    let checkInOut;
    checkInOut = await this.prisma.checkInOut.findFirst({
      where: {
        clientId: id,
        requestType: 'client',
        apartmentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
      },
    });
    if (checkInOut) {
      if (checkInOut && checkInOut.type === 'checkout') {
        const lastCheckIn = await this.prisma.checkInOut.findFirst({
          where: {
            NOT: {
              id: checkInOut.id,
            },
            clientId: id,
            requestType: 'client',
            type: 'checkin',
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (lastCheckIn) {
          const { hours, minutes } = getTimeDifferenceInHrsMins(
            lastCheckIn.createdAt,
            checkInOut.createdAt,
          );
          checkInOut = { ...checkInOut, hours, minutes };
        }
      } else {
        const { hours, minutes } = getTimeDifferenceInHrsMins(
          checkInOut.createdAt,
          new Date(),
        );
        checkInOut = { ...checkInOut, hours, minutes };
      }
    } else {
      checkInOut = null;
    }

    return {
      ...user,
      checkInOut,
    };
  }

  async getResidentStaff(data: GetAllParams) {
    const { apartmentId, q } = data;

    const staffs = await this.prisma.clientStaff.findMany({
      where: {
        apartmentId,
        archive: false,
        name: { contains: q || undefined, mode: 'insensitive' },
        status: 'approved',
        approvedByAdmin: true,
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        personalStaffRole: { select: { name: true } },
      },
    });

    return staffs;
  }

  async getResidentStaffById(data: GetParam) {
    const { id, apartmentId } = data;

    const user = await this.prisma.clientStaff.findUnique({
      where: {
        id,
        archive: false,
        apartmentId,
        status: 'approved',
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        contact: true,
        personalStaffRole: { select: { name: true } },
        flats: {
          select: {
            id: true,
            name: true,
            floor: { select: { block: { select: { name: true } } } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User doesnot exist');

    let checkInOut;
    checkInOut = await this.prisma.checkInOut.findFirst({
      where: {
        clientStaffId: id,
        requestType: 'clientstaff',
        apartmentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        flats: {
          select: {
            id: true,
          },
        },
      },
    });

    if (checkInOut) {
      if (checkInOut.type === 'checkout') {
        const lastCheckIn = await this.prisma.checkInOut.findFirst({
          where: {
            NOT: {
              id: checkInOut.id,
            },
            clientStaffId: id,
            requestType: 'clientstaff',
            type: 'checkin',
          },
        });

        if (lastCheckIn) {
          const { hours, minutes } = getTimeDifferenceInHrsMins(
            lastCheckIn.createdAt,
            checkInOut.createdAt,
          );
          checkInOut = { ...checkInOut, hours, minutes };
        }
      } else {
        const { hours, minutes } = getTimeDifferenceInHrsMins(
          checkInOut.createdAt,
          new Date(),
        );
        checkInOut = { ...checkInOut, hours, minutes };
      }
    } else {
      checkInOut = null;
    }

    return {
      ...user,
      checkInOut,
    };
  }

  async getSocietyStaff(data: GetAllParams) {
    const { apartmentId, q } = data;

    const staffs = await this.prisma.adminService.findMany({
      where: {
        apartmentId,
        archive: false,
        name: { contains: q || undefined, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        role: { select: { id: true, name: true } },
      },
    });

    return staffs;
  }

  async getSocietyStaffById(data: GetParam) {
    const { id, apartmentId } = data;

    const staff = await this.prisma.adminService.findUnique({
      where: {
        id,
        archive: false,
        apartmentId,
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        contact: true,
        role: { select: { id: true, name: true } },
        shift: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!staff) throw new NotFoundException('Staff doesnot exist');

    let checkInOut;
    checkInOut = await this.prisma.checkInOut.findFirst({
      where: {
        adminserviceId: id,
        requestType: 'adminservice',
        apartmentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
      },
    });

    if (checkInOut) {
      if (checkInOut.type === 'checkout') {
        const lastCheckIn = await this.prisma.checkInOut.findFirst({
          where: {
            NOT: {
              id: checkInOut.id,
            },
            adminserviceId: id,
            requestType: 'adminservice',
            type: 'checkin',
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (lastCheckIn) {
          const { hours, minutes } = getTimeDifferenceInHrsMins(
            lastCheckIn.createdAt,
            checkInOut.createdAt,
          );
          checkInOut = { ...checkInOut, hours, minutes };
        }
      } else {
        const { hours, minutes } = getTimeDifferenceInHrsMins(
          checkInOut.createdAt,
          new Date(),
        );
        checkInOut = { ...checkInOut, hours, minutes };
      }
    } else {
      checkInOut = null;
    }

    return {
      ...staff,
      checkInOut,
    };
  }

  async getGuard(data: GetAllParams) {
    const { apartmentId, q } = data;

    const guards = await this.prisma.guardUser.findMany({
      where: {
        apartmentId,
        archive: false,
        name: { contains: q || undefined, mode: 'insensitive' },
        OR: [
          {
            attendance: {
              none: {
                date: this.attendance.createAttendanceDetails().date,
              },
            },
          },
          {
            attendance: {
              some: {
                date: this.attendance.createAttendanceDetails().date,
                events: {
                  none: {
                    clockedOut: false,
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        contact: true,
        surveillance: { select: { name: true } },
        shift: { select: { name: true } },
      },
    });

    return guards;
  }

  async getSingleGuard(data: GetParam) {
    const { id, apartmentId } = data;

    const guard = await this.prisma.guardUser.findUnique({
      where: {
        id,
        apartmentId,
        archive: false,
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        contact: true,
        surveillance: { select: { name: true } },
        shift: { select: { name: true } },
        attendance: {
          where: {
            date: this.attendance.createAttendanceDetails().date,
          },
          select: {
            events: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: {
                clockedInTime: true,
                clockedOutTime: true,
                clockedOut: true,
              },
            },
          },
        },
      },
    });

    if (!guard) throw new NotFoundException('Guard does not exist');

    return {
      ...guard,
      attendance: undefined,
      clockedOut: guard.attendance[0]?.events[0]?.clockedOut || false,
      clockedInTime: guard.attendance[0]?.events[0]?.clockedInTime || null,
      clockedOutTime: guard.attendance[0]?.events[0]?.clockedOutTime || null,
    };
  }

  async getGuardClockedIn(data: GetAllParams) {
    const { apartmentId, q } = data;

    const { date } = this.attendance.createAttendanceDetails();

    const guards = await this.prisma.guardClockedEvent.findMany({
      where: {
        attendance: {
          apartmentId,
          date,
          user: {
            name: { contains: q || undefined, mode: 'insensitive' },
          },
        },
        clockedOut: false,
      },
      select: {
        attendance: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: { select: { url: true } },
                contact: true,
                surveillance: { select: { name: true } },
                shift: { select: { name: true } },
              },
            },
            events: {
              where: { clockedOut: false },
              select: { clockedInTime: true },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
      },
    });

    const currentTime = moment();

    const guardsWithTimeDifference = guards.map((guard) => {
      const eventsWithTimeDifference = guard?.attendance?.events.map(
        (event) => {
          const start = moment(event.clockedInTime);
          const difference = this.attendance.calculateTimeDifferenceFormatted(
            moment(start),
            moment(currentTime),
          );
          const { hours, minutes } = getTimeDifferenceInHrsMins(
            start.toDate(),
            currentTime.toDate(),
          );
          return { ...event, timeDifference: difference, hours, minutes };
        },
      );

      return {
        ...guard,
        attendance: { ...guard.attendance, events: eventsWithTimeDifference },
      };
    });

    return guardsWithTimeDifference;
  }

  async getManagement(data: GetAllParams) {
    const { apartmentId, q } = data;

    const staffs = await this.prisma.adminUser.findMany({
      where: {
        apartmentId,
        archive: false,
        name: { contains: q || undefined, mode: 'insensitive' },
        OR: [
          {
            attendance: {
              none: {
                date: this.attendance.createAttendanceDetails().date,
              },
            },
          },
          {
            attendance: {
              some: {
                date: this.attendance.createAttendanceDetails().date,
                events: {
                  none: {
                    clockedOut: false,
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        contact: true,
        role: { select: { name: true } },
        shift: { select: { name: true } },
      },
    });

    return staffs;
  }

  async getManagementClockedIn(data: GetAllParams) {
    const { apartmentId, q } = data;

    const { date } = this.attendance.createAttendanceDetails();

    const managements = await this.prisma.adminClockedEvent.findMany({
      where: {
        attendance: {
          apartmentId,
          date,
          user: {
            name: { contains: q || undefined, mode: 'insensitive' },
          },
        },
        clockedOut: false,
      },
      select: {
        attendance: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: { select: { url: true } },
                contact: true,
                shift: { select: { name: true } },
                role: { select: { name: true } },
              },
            },
            events: {
              where: { clockedOut: false },
              select: {
                clockedInTime: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
      },
    });

    const currentTime = moment();

    const managementWithTimeDifference = managements.map((guard) => {
      const eventsWithTimeDifference = guard?.attendance?.events.map(
        (event) => {
          const start = moment(event.clockedInTime);
          const difference = this.attendance.calculateTimeDifferenceFormatted(
            moment(start),
            moment(currentTime),
          );
          const { hours, minutes } = getTimeDifferenceInHrsMins(
            start.toDate(),
            currentTime.toDate(),
          );
          return { ...event, timeDifference: difference, hours, minutes };
        },
      );

      return {
        ...guard,
        attendance: { ...guard.attendance, events: eventsWithTimeDifference },
      };
    });

    return managementWithTimeDifference;
  }

  async getSingleManagementClockedIn(data: GetParam) {
    const { id, apartmentId } = data;

    const admin = await this.prisma.adminUser.findUnique({
      where: {
        id,
        apartmentId,
        archive: false,
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
        contact: true,
        shift: { select: { name: true } },
        attendance: {
          where: {
            date: this.attendance.createAttendanceDetails().date,
          },

          select: {
            events: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: {
                clockedInTime: true,
                clockedOutTime: true,
                clockedOut: true,
              },
            },
          },
        },
      },
    });

    if (!admin) throw new NotFoundException('Admin does not exist');

    return {
      ...admin,
      attendance: undefined,
      clockedOut: admin.attendance[0]?.events[0]?.clockedOut || false,
      clockedInTime: admin.attendance[0]?.events[0]?.clockedInTime || null,
      clockedOutTime: admin.attendance[0]?.events[0]?.clockedOutTime || null,
    };
  }
}
