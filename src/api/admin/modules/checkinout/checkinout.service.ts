import { Injectable } from '@nestjs/common';
import { GetAllParams } from '../../common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { getPageDocs, pagination } from 'src/common/utils';

@Injectable()
export class CheckInOutService {
  constructor(private readonly prisma: PrismaService) {}

  async getCheckInOut(data: GetAllParams) {
    const { apartmentId, filter, q, sort, date } = data;

    const { page, limit, skip } = pagination({
      page: data.page,
      limit: data.limit,
    });

    //!All case
    const allCheckInOut = await this.prisma.checkInOut.findMany({
      where: {
        requests: { every: { status: 'approved' } },
        apartmentId,
      },
      select: {
        id: true,
        entered: true,
        image: true,
        createdByGuard: {
          select: {
            image: { select: { url: true } },
            name: true,
          },
        },
        requests: {
          select: {
            type: true,
            approvedByGuard: {
              select: {
                image: { select: { url: true } },
                name: true,
              },
            },
            updatedAt: true,
          },
        },
        requestType: true,
        type: true,
        surveillance: { select: { name: true } },
        guest: {
          select: {
            name: true,
            isOneDay: true,
          },
        },
        ride: {
          select: {
            riderName: true,
          },
        },
        delivery: {
          select: {
            name: true,
            flats: {
              select: {
                name: true,
                floor: {
                  select: {
                    name: true,
                    block: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        flatJson: true,
        parentJson: true,
        flatArrayJson: true,
        updatedAt: true,
        vehicleNo: true,
        vehicleType: true,
        clientStaff: {
          select: {
            name: true,
            personalStaffRole: {
              select: { name: true },
            },
            image: { select: { url: true } },
          },
        },
        flatName: true,
        adminService: {
          select: {
            name: true,
            role: { select: { name: true } },
            image: { select: { url: true } },
          },
        },
        client: {
          select: {
            name: true,
            image: { select: { url: true } },
          },
        },
        vehicle: {
          select: {
            name: true,
            contact: true,
            vehicleNumber: true,
            vehicle: {
              select: {
                name: true,
                image: { select: { url: true } },
              },
            },
          },
        },
        groupEntry: {
          where: { isCreated: true },
          select: {
            name: true,
            contact: true,
            isCreated: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    //? Manipulating data as per visitor type
    const filteredCheckInOut = allCheckInOut.map((entry) => {
      switch (entry.requestType) {
        case 'guest':
          return {
            id: entry.id,
            name: entry.guest?.name || 'Unknown Guest',
            type: entry.guest?.isOneDay
              ? 'Short term visitor'
              : 'Long term visitor',
            filterType: 'visitor',
            requestType: entry.requestType,
            flat: entry.flatJson,
            parent: entry.parentJson,
            checkInOut: entry.type,
            updatedAt: entry.updatedAt,
            vehicleNo: entry.vehicleNo,
            vehicleType: entry.vehicleType,
            approvedBy:
              entry.requests[0]?.approvedByGuard || entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.image,
          };

        case 'ride':
          return {
            id: entry.id,
            name: entry.ride?.riderName || 'Unknown Ride',
            type: 'Short term visitor',
            filterType: 'visitor',
            requestType: entry.requestType,
            parent: entry.parentJson,
            flat: entry.flatJson,
            checkInOut: entry.type,
            updatedAt: entry.updatedAt,
            vehicleNo: entry.vehicleNo,
            vehicleType: entry.vehicleType,
            approvedBy:
              entry.requests[0]?.approvedByGuard || entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.image,
          };

        case 'delivery':
          return {
            id: entry.id,
            name: entry.delivery?.name || 'Unknown Delivery',
            type: 'Short term visitor',
            filterType: 'visitor',
            requestType: entry.requestType,
            flat: entry.delivery?.flats[0],
            checkInOut: entry.type,
            updatedAt: entry.updatedAt,
            vehicleNo: entry.vehicleNo,
            vehicleType: entry.vehicleType,
            approvedBy:
              entry.requests[0]?.approvedByGuard || entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.image,
          };

        case 'service':
          return {
            id: entry.id,
            name: entry.service?.name || 'Unknown Service',
            type: 'Short term visitor',
            requestType: entry.requestType,
            filterType: 'visitor',
            flat: entry.flatJson,
            checkInOut: entry.type,
            updatedAt: entry.updatedAt,
            vehicleNo: entry.vehicleNo,
            vehicleType: entry.vehicleType,
            approvedBy:
              entry.requests[0]?.approvedByGuard || entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.image,
          };

        case 'client':
          return {
            name: entry.client?.name || 'Unknown Guest',
            type: 'Resident',
            filterType: 'client',
            // requestType: entry.client?.type,
            flat: entry.flatArrayJson,
            checkInOut: entry.type,
            updatedAt: entry.updatedAt,
            vehicleNo: entry.vehicleNo,
            vehicleType: entry.vehicleType,
            approvedBy: entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.client?.image?.url,
          };

        case 'clientstaff':
          return {
            name: entry.clientStaff?.name || 'Unknown Staff',
            type: 'Residential Staff',
            filterType: 'clientstaff',
            requestType: entry.clientStaff?.personalStaffRole?.name,
            flat: entry.flatName,
            checkInOut: entry.type,
            updatedAt: entry.updatedAt,
            vehicleNo: entry.vehicleNo,
            vehicleType: entry.vehicleType,
            approvedBy: entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.clientStaff?.image?.url,
          };

        case 'adminservice':
          return {
            name: entry.adminService?.name || 'Unknown Service',
            type: 'Society Staff',
            filterType: 'adminservice',
            requestType: entry.adminService?.role.name || '',
            checkInOut: entry.type,
            updatedAt: entry.updatedAt,
            vehicleNo: entry.vehicleNo,
            vehicleType: entry.vehicleType,
            approvedBy: entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.adminService?.image?.url,
          };

        case 'guestmass':
          return {
            name: entry.entered?.toString(),
            type: 'Mass Entry',
            filterType: 'guestmass',
            requestType: 'Mass Entry',
            checkInOut: entry.type,
            parent: entry.parentJson,
            flat: entry.flatJson,
            updatedAt: entry.updatedAt,
            approvedBy: entry.createdByGuard,
            surveillance: entry.surveillance?.name,
          };

        case 'vehicle':
          return {
            name: 'A vehicle',
            type: 'Vehicle',
            filterType: 'vehicle',
            requestType: 'Vehicle',
            checkInOut: entry.type,
            parent: entry.vehicle,
            updatedAt: entry.updatedAt,
            approvedBy: entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.image,
          };

        case 'group':
          return {
            name: 'A visitor',
            type: 'Visitor',
            filterType: 'group',
            requestType: 'Group',
            checkInOut: entry.type,
            parent: {
              name: entry.groupEntry?.name,
              contact: entry.groupEntry?.contact,
              image: entry.image,
            },
            updatedAt: entry.updatedAt,
            approvedBy: entry.createdByGuard,
            surveillance: entry.surveillance?.name,
            image: entry.image,
          };
      }
    });

    const filteredAndSortedCheckInOut = filteredCheckInOut
      .filter((entry) => {
        if (filter) {
          if (entry!.filterType) {
            return entry!.filterType === filter;
          } else {
            return false;
          }
        }
        return true;
      })
      .filter((entry) => {
        if (date) {
          const createdAtDate = new Date(entry.updatedAt);
          const filterDate = new Date(date);
          return (
            createdAtDate.getFullYear() === filterDate.getFullYear() &&
            createdAtDate.getMonth() === filterDate.getMonth() &&
            createdAtDate.getDate() === filterDate.getDate()
          );
        }
        return true;
      })
      .filter((entry) => {
        if (q) {
          return (
            entry &&
            entry.name &&
            entry.name.toLowerCase().includes(q.toLowerCase())
          );
        }
        return true;
      });

    if (sort) {
      filteredAndSortedCheckInOut.sort((a, b) => {
        // Sort alphabetically by name
        if (!a?.name || !b?.name) return 0;
        if (sort === 'asc') {
          return a.name.localeCompare(b.name);
        } else if (sort === 'desc') {
          return b.name.localeCompare(a.name);
        } else {
          return 0;
        }
      });
    }

    const count = filteredAndSortedCheckInOut.length;

    const docs = getPageDocs({
      page,
      limit,
      count,
    });

    const paginatedResult = filteredAndSortedCheckInOut.slice(
      skip,
      skip + limit,
    );

    return { docs, result: paginatedResult };
  }
}
