import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignedUserParam } from 'src/api/client/common/interfaces';
import { timeDifference } from 'src/common/utils/time-difference';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createPollDto } from './dtos/create-poll.dto';
import { AdminNotificationService } from 'src/global/notification/admin-notification.service';

@Injectable()
export class PollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: AdminNotificationService,
  ) {}

  async getOngoing({ user }: AssignedUserParam.GetAll) {
    const currentDate = new Date();

    const pollArray = await this.prisma.poll.existMany(user.apartmentId, {
      where: {
        archive: false,
        endAt: {
          gte: currentDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        countVisible: true,
        endAt: true,
        createdAt: true,
        pollAnswers: {
          select: {
            id: true,
            title: true,
            voteCount: true,
            user: { select: { id: true } },
          },
          orderBy: {
            createdAt: 'asc',
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
        sum,
        pollAnswers: poll.pollAnswers.map((answer) => {
          const hasVoted = answer.user.some((i) => i.id === user.id);
          return {
            ...answer,
            percent: sum ? (answer.voteCount / sum) * 100 : 0,
            hasVoted: hasVoted,
            ...(!!poll.countVisible
              ? { voteCount: answer.voteCount }
              : { voteCount: null }),
          };
        }),
      };
    });

    return polls;
  }

  async getAll({ user, filter, page, limit }: AssignedUserParam.GetAll) {
    if (!user) throw new BadRequestException('Not logged in');

    let whereClause: any = {
      archive: false,
    };

    if (filter && !isNaN(Date.parse(filter))) {
      const filterDate = new Date(filter);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause = {
        ...whereClause,
        AND: [
          {
            createdAt: {
              gte: filterDate.toISOString(),
            },
          },
          {
            createdAt: {
              lt: nextDay.toISOString(),
            },
          },
        ],
      };
    }

    const currentDate = new Date();

    const pollArray = await this.prisma.poll.getAllPaginatedById(
      {
        apartmentId: user.apartmentId,
        page: page,
        limit: limit,
      },
      {
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          countVisible: true,
          endAt: true,
          createdAt: true,
          pollAnswers: {
            select: {
              id: true,
              title: true,
              voteCount: true,
              user: { select: { id: true } },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      },
    );

    const polls = pollArray.data.map((poll) => {
      const sum = poll.pollAnswers.reduce((acc, answer) => {
        return acc + (answer.voteCount || 0);
      }, 0);

      return {
        ...poll,
        time: timeDifference(currentDate, poll.endAt),
        sum,
        pollAnswers: poll.pollAnswers.map((answer) => {
          const hasVoted = answer.user.some((i) => i.id === user.id);
          return {
            ...answer,
            percent: (answer.voteCount / sum) * 100,
            hasVoted: hasVoted,
            ...(!!poll.countVisible
              ? { voteCount: answer.voteCount }
              : { voteCount: null }),
          };
        }),
      };
    });

    const result = {
      docs: pollArray.docs,
      data: polls,
    };

    return result;
  }

  async getById({ user, id }: AssignedUserParam.Get) {
    const poll = await this.prisma.poll.findUnique({
      where: {
        id,
        apartmentId: user.apartmentId,
        archive: false,
      },
      select: {
        id: true,
        title: true,
        countVisible: true,
        endAt: true,
        createdAt: true,
        pollAnswers: {
          select: {
            id: true,
            title: true,
            voteCount: true,
            user: { select: { id: true } },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!poll) throw new NotFoundException('Poll does not exist');

    const sum = poll.pollAnswers.reduce((acc, answer) => {
      return acc + (answer.voteCount || 0);
    }, 0);

    return {
      ...poll,
      time: timeDifference(new Date(), poll.endAt),
      sum,
      pollAnswers: poll.pollAnswers.map((answer) => {
        const hasVoted = answer.user.some((i) => i.id === user.id);
        return {
          ...answer,
          percent: sum ? (answer.voteCount / sum) * 100 : 0,
          hasVoted: hasVoted,
          ...(!!poll.countVisible
            ? { voteCount: answer.voteCount }
            : { voteCount: null }),
        };
      }),
    };
  }

  async create({ body, user }: AssignedUserParam.Create<createPollDto>) {
    const { pollAnswerId } = body;

    const valid = await this.prisma.pollAnswer.findUnique({
      where: { id: pollAnswerId },
      include: { poll: true },
    });

    if (!valid) throw new NotFoundException('Poll answer does not exist');

    //Check if poll has expired and is valid too
    const currentDate = new Date();

    const poll = await this.prisma.poll.findUnique({
      where: {
        id: valid.pollId,
        apartmentId: user.apartmentId,
        endAt: {
          gte: currentDate,
        },
      },
    });

    if (!poll) throw new NotFoundException('Poll does not exist');

    // Check if the user has already voted for this poll answer
    const userVoted = await this.prisma.clientUser.findFirst({
      where: {
        id: user.id,
        pollAnswers: {
          some: {
            id: pollAnswerId,
          },
        },
      },
    });

    if (userVoted)
      throw new ConflictException(
        'User has already voted for this poll answer',
      );

    // Increment the vote count of the selected answer and associate the user with it
    const updatePoll = await this.prisma.pollAnswer.update({
      where: { id: pollAnswerId },
      data: {
        voteCount: { increment: 1 },
        user: {
          connect: { id: user.id },
        },
      },
    });

    if (
      user.apartmentId &&
      updatePoll.voteCount > valid.voteCount &&
      updatePoll.voteCount % 50 === 0
    ) {
      await this.notification.create({
        type: 'recent_poll',
        apartmentId: user.apartmentId,
        digits: updatePoll.voteCount,
      });
    }

    // Deduct the vote count by 1 for all other poll answers associated with the same poll
    const otherPollAnswers = await this.prisma.pollAnswer.findMany({
      where: {
        pollId: poll.id,
        NOT: {
          id: pollAnswerId,
        },
      },
    });

    for (const answer of otherPollAnswers) {
      const userHasVotedForAnswer = await this.prisma.clientUser.findFirst({
        where: {
          id: user.id,
          pollAnswers: {
            some: {
              id: answer.id,
            },
          },
        },
      });

      if (userHasVotedForAnswer) {
        await this.prisma.pollAnswer.update({
          where: { id: answer.id },
          data: {
            user: {
              disconnect: { id: user.id },
            },
            voteCount: {
              decrement: 1,
            },
          },
        });
      }
    }

    return updatePoll;
  }
}
