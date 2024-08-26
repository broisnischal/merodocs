import { Injectable } from '@nestjs/common';
import { timeDifference } from 'src/common/utils/time-difference';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { AssignedUserParam } from '../../common/interfaces';

@Injectable()
export class ClientCommonService {
  constructor(private readonly prisma: PrismaTransactionService) {}

  async getBanner({ user }: AssignedUserParam.GetAll) {
    const banner = await this.prisma.clientPopUpBanner.findFirst({
      where: {
        activated: true,
        enabled: true,
        apartmentId: user.apartmentId,
      },
      select: {
        link: true,
        mobImage: true,
      },
    });

    return banner;
  }

  // to switch data
  async statusDetails({ user }: { user: FlatOrUserId }) {
    const data = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
      omit: {
        token: true,
      },
      include: {
        flats: true,
        currentFlats: {
          select: {
            id: true,
            flat: {
              select: {
                name: true,
                id: true,
                floor: {
                  select: {
                    id: true,
                    name: true,
                    block: {
                      select: {
                        id: true,

                        name: true,
                        apartment: {
                          select: {
                            id: true,

                            name: true,
                            area: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            type: true,
            apartmentId: true,
            flatId: true,
          },
        },
        clientApartments: {
          where: {
            flatId: user.flatId,
            requestType: {
              in: ['addAccount', 'moveIn'],
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
          include: {
            documents: true,
          },
        },
        image: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    if (!data) return null;

    let stepper = {
      userVerified: data.verified,
      nameEmailSubmitted: data.name && data.email ? true : false,
      documentsSubmitted:
        data.clientApartments.length > 0
          ? data.clientApartments[0].documents.length > 0
            ? true
            : false
          : false,
      documents: null,
      isMoveInDate: data.currentFlats.length > 0 ? true : false,
    };

    const switchData = data.currentFlats.map((i) => {
      return {
        ...i,
        selected: i.flat.id === user.flatId,
      };
    });

    const currentFlat = data.currentFlats.find((i) => i.flatId === user.flatId);

    await this.prisma.apartmentClientUser.findMany({
      where: {
        clientUserId: user.id,
        status: 'pending',
      },
      include: {
        flat: true,
        documents: true,
      },
    });

    return {
      switchData,
      residing: data.residing,
      email: data.email,
      name: data.name,
      type: currentFlat?.type ? currentFlat.type : '',
      id: data.id,
      image: data.image,
      currentFlat: currentFlat ? currentFlat.flat : null,
      ...stepper,
    };
  }

  async homeDetails({ user: value }: { user: FlatOrUserId }) {
    const response = await this.prisma.clientUser.findUnique({
      where: {
        id: value.id,
      },
      include: {
        flats: true,
        currentFlats: {
          select: {
            id: true,
            type: true,
            flat: {
              select: {
                name: true,
                id: true,
                floor: {
                  select: {
                    id: true,
                    name: true,
                    block: {
                      select: {
                        id: true,

                        name: true,
                        apartment: {
                          select: {
                            id: true,

                            name: true,
                            area: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            apartmentId: true,
            flatId: true,
          },
        },
        image: {
          select: {
            id: true,
            url: true,
          },
        },
        apartmentClientUserVerified: {
          where: {
            status: 'approved',
          },
          select: {
            documents: {
              select: {
                id: true,
                url: true,
              },
            },
            moveIn: true,
            movedOutOrNot: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!response) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token, ...data } = response;

    const switchData = data.currentFlats.map((i) => {
      return {
        ...i,
        selected: i.flat.id === value.flatId,
      };
    });

    const currentFlat = data.currentFlats.find(
      (i) => i.flatId === value.flatId,
    );

    const currentNotices = await this.prisma.notice.findMany({
      where: {
        archive: false,
        apartment: {
          Flat: {
            some: {
              id: {
                equals: value.flatId || 'null',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        title: true,
        category: true,
        message: true,
        id: true,
        document: {
          select: {
            id: true,
            url: true,
          },
        },
        createdAt: true,
      },
      take: 3,
    });

    const currentDate = new Date();

    const pollArray = await this.prisma.poll.findMany({
      where: {
        archive: false,
        apartment: {
          Flat: {
            some: {
              id: {
                equals: value.flatId || 'null',
              },
            },
          },
        },
        endAt: {
          gte: currentDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,

      select: {
        id: true,
        title: true,
        countVisible: true,
        _count: true,
        endAt: true,
        pollAnswers: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    const polls = pollArray.map((poll) => {
      const sum = poll.pollAnswers.reduce((acc, answer) => {
        return acc + (answer.voteCount || 0);
      }, 0);

      return {
        ...poll,
        time: timeDifference(currentDate, poll.endAt),
        sum: poll.countVisible ? sum : undefined,
        pollAnswers: poll.pollAnswers.map((answer) => {
          const hasVoted = answer.user.some(
            (curuser) => curuser.id === value.id,
          );
          return {
            ...answer,
            percent: poll.countVisible
              ? (answer.voteCount / sum) * 100
              : undefined,
            hasVoted: hasVoted,
            ...(!!poll.countVisible
              ? { voteCount: null }
              : { voteCount: answer.voteCount }),
          };
        }),
      };
    });

    const unreadNotification = await this.prisma.clientNotification.count({
      where: {
        isRead: false,
        clientUserId: value.id,
      },
    });

    return currentFlat
      ? {
          switchData: switchData,
          residing: data.residing,
          email: data.email,
          name: data.name,
          type: currentFlat.flat,
          id: data.id,
          image: data.image,
          currentFlat,
          notices: currentNotices,
          polls,
          unreadNotification,
        }
      : {
          switchData: switchData,
          residing: data.residing,
          email: data.email,
          name: data.name,
          type: '',
          image: data.image,
          id: data.id,
          currentFlat: null,
          notices: currentNotices,
          polls,
          unreadNotification,
        };
  }
}
