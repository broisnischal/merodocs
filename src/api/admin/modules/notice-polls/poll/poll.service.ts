import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
} from '../../../common/interface';
import { createPollDto } from './dtos/index.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';
import { capitalize } from 'lodash';

@Injectable()
export class PollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
    private readonly clientNotification: ClientNotificationService,
  ) {}

  async create(data: CreateParams<createPollDto>) {
    const { postData, loggedUserData } = data;

    const { title, countVisible, choices } = postData;

    const apartmentId = loggedUserData.apartmentId;

    const date = new Date(postData.endAt);

    if (isNaN(date.getTime()))
      throw new BadRequestException('Invalid date sent');

    const now = new Date();

    if (+date < +now) throw new BadRequestException('Poll Date cannot be past');

    const uniqueChoices = new Set(choices);
    if (uniqueChoices.size !== choices.length)
      throw new BadRequestException('Choices must be unique');

    const poll = await this.prisma.poll.create({
      data: {
        title,
        countVisible,
        endAt: date,
        apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
      include: {
        apartment: { select: { name: true } },
      },
    });

    const response = await Promise.all(
      choices.map(async (item) => {
        const answer = await this.prisma.pollAnswer.create({
          data: {
            title: item,
            pollId: poll.id,
            voteCount: 0,
          },
        });

        return answer;
      }),
    );

    await this.activityService.create({
      message: `Created the poll`,
      type: 'poll',
      loggedUserData,
    });

    const apartmentClients = await this.prisma.flatCurrentClient.findMany({
      where: {
        apartmentId,
        offline: false,
      },
      select: {
        clientUserId: true,
        clientUser: {
          select: {
            devices: {
              select: {
                fcmToken: true,
              },
            },
          },
        },
        flatId: true,
      },
    });

    await Promise.all(
      apartmentClients.map(async (client) => {
        const tokens = client.clientUser.devices
          .map((d) => d.fcmToken)
          .filter((token) => token);

        await this.clientNotification.createNotification(
          {
            type: 'polls',
            title: `New Poll Created | ${poll.apartment.name}`,
            body: `${capitalize(poll.title)}`,
            id: poll.id,
            clickable: true,
            path: ClientAppRouter.POLL,
            flatId: client.flatId,
            clientUserId: client.clientUserId,
          },
          tokens,
        );
      }),
    );

    return response;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId } = data;

    const polls = await this.prisma.poll.existMany(apartmentId, {
      where: {
        archive: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        countVisible: true,
        createdAt: true,
        endAt: true,
        createdBy: {
          select: {
            name: true,
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
          },
        },
        pollAnswers: {
          select: {
            id: true,
            title: true,
            voteCount: true,
          },
        },
      },
    });

    const pollsWithTotalVoteCount = polls.map((poll) => {
      const totalVoteCount = poll.pollAnswers.reduce(
        (sum, answer) => sum + answer.voteCount,
        0,
      );

      // Calculate percentage for each answer
      const pollAnswersWithPercent = poll.pollAnswers.map((answer) => ({
        ...answer,
        percent:
          totalVoteCount !== 0 ? (answer.voteCount / totalVoteCount) * 100 : 0,
      }));

      return { ...poll, totalVoteCount, pollAnswers: pollAnswersWithPercent };
    });

    return pollsWithTotalVoteCount;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.poll.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Poll doesnot exist');

    const poll = await this.prisma.poll.delete({
      where: { id },
    });

    await this.prisma.pollAnswer.deleteMany({
      where: { pollId: valid.id },
    });

    await this.activityService.create({
      message: `Deleted the poll`,
      type: 'poll',
      loggedUserData,
    });

    return poll;
  }
}
