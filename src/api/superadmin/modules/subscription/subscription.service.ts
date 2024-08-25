import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { DeleteParams, UpdateParams } from '../../common/interface';
import {
  expireSubscriptionDto,
  addSubscriptionDto,
  renewSubscriptionDto,
  updateSubscriptionDto,
  updateInstallmentDto,
} from './dto/index.dto';
import { calculateEndDate } from '../../utils/enddate.utils';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaTrx: PrismaTransactionService,
  ) {}

  async renew(data: UpdateParams<renewSubscriptionDto>) {
    const { id, postData } = data;
    const {
      firstPayment: providedFirstPayment,
      pattern,
      price,
      time,
    } = postData;

    const valid = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!valid) {
      throw new NotFoundException('Subscription does not exist');
    }

    const ifAnyScheduled = await this.prisma.subscription.count({
      where: {
        apartmentId: valid.apartmentId,
        status: 'active',
        active: false,
      },
    });

    if (ifAnyScheduled >= 1) {
      throw new NotFoundException('Cannot renew more than once');
    }

    let date;
    let remaining = 0;
    let paid = 0;
    let firstPayment = providedFirstPayment;

    if (pattern === 'installment') {
      if (!firstPayment)
        throw new BadRequestException(
          'First payment is required for installment pattern subscriptions',
        );
      remaining = price - firstPayment;
      paid = firstPayment;
    } else {
      remaining = 0;
      paid = price;
    }

    date = calculateEndDate(valid.endAt, time);

    const subscription = await this.prisma.subscription.create({
      data: {
        type: 'paid',
        endAt: date,
        apartmentId: valid.apartmentId,
        pattern,
        paid,
        remaining,
        time,
        price,
        active: false,
        createdAt: valid.endAt,
      },
    });

    await this.prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        paid,
      },
    });

    await this.prisma.apartment.update({
      where: { id: valid.apartmentId },
      data: {
        status: 'active',
      },
    });

    return subscription;
  }

  async update(data: UpdateParams<updateSubscriptionDto>) {
    const { id, postData, loggedUserData } = data;
    const { price, time } = postData;

    const subscription = await this.prisma.subscription.findUnique({
      where: { id, type: 'paid' },
      include: {
        apartment: {
          select: {
            subscription: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription does not exist');
    }

    if (price !== undefined && price < subscription.paid!) {
      throw new BadRequestException('Price cannot be less than paid price');
    }

    if (price !== undefined) {
      const historySum = await this.prisma.subscriptionHistory.aggregate({
        where: { subscriptionId: subscription.id },
        _sum: { paid: true },
      });

      const updatedRemaining = Math.max(
        0,
        price - (historySum?._sum?.paid || 0),
      );

      await this.prisma.subscription.update({
        where: { id },
        data: { remaining: updatedRemaining, price },
      });
    }

    if (time !== undefined) {
      if (subscription.endAt && Date.now() > subscription.endAt.getTime()) {
        throw new BadRequestException(
          'Cannot update subscription as current time has passed the end date',
        );
      }

      const date = calculateEndDate(new Date(subscription.createdAt), time);

      const scheduledSubscriptions = await this.prisma.subscription.findMany({
        where: {
          apartmentId: subscription.apartmentId,
          active: false,
          time: { not: null },
        },
      });

      await Promise.all(
        scheduledSubscriptions.map(async (scheduled) => {
          const scheduledEndDate = calculateEndDate(date, scheduled.time!);
          await this.prisma.subscription.update({
            where: { id: scheduled.id },
            data: { createdAt: date, endAt: scheduledEndDate },
          });
        }),
      );

      await this.prisma.subscription.update({
        where: { id },
        data: {
          endAt: date,
          time,
          updatedById: loggedUserData.id,
        },
      });
    }

    const updatedSubscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        apartment: {
          select: {
            subscription: true,
          },
        },
      },
    });

    const apartmentStatus =
      updatedSubscription?.remaining === 0 ? 'paid' : 'due';

    await this.prisma.apartment.update({
      where: { id: updatedSubscription?.apartmentId },
      data: { subscription: apartmentStatus },
    });

    return updatedSubscription;
  }

  async add(data: UpdateParams<addSubscriptionDto>) {
    const { id, postData, loggedUserData } = data;
    const { price } = postData;

    const valid = await this.prisma.subscription.findUnique({
      where: { id, type: 'paid', pattern: 'installment' },
    });

    if (!valid) {
      throw new NotFoundException('Subscription does not exist');
    }

    if (
      valid.price === null ||
      valid.paid === null ||
      valid.remaining === null
    ) {
      throw new BadRequestException('Price or Paid value is set as null');
    }

    if (price > valid.remaining)
      throw new BadRequestException(
        'Installment cannot be greater than remaining to pay',
      );

    const paid = valid.paid + price;
    const remaining = valid.price - paid;

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: { paid, remaining, updatedById: loggedUserData.id },
    });

    const history = await this.prisma.subscriptionHistory.create({
      data: { subscriptionId: subscription.id, paid: price },
    });

    const apartmentStatus = remaining === 0 ? 'paid' : 'due';

    await this.prisma.apartment.update({
      where: { id: subscription.apartmentId },
      data: { subscription: apartmentStatus },
    });

    return { subscription, history };
  }

  async expire(data: UpdateParams<expireSubscriptionDto>) {
    const { id, postData, loggedUserData } = data;
    const { reason } = postData;

    const valid = await this.prisma.subscription.findUnique({
      where: { id, status: 'active', active: true },
    });

    if (!valid) {
      throw new NotFoundException('Subscription does not exist');
    }

    const subscription = await this.prisma.subscription.update({
      where: {
        id,
      },
      data: {
        status: 'expired',
        expireReason: reason,
        expiredById: loggedUserData.id,
      },
    });

    return subscription;
  }

  async updateInstallment(data: UpdateParams<updateInstallmentDto>) {
    const { id, postData, loggedUserData } = data;
    const { price } = postData;

    const history = await this.prisma.subscriptionHistory.findUnique({
      where: { id },
      include: { subscription: true },
    });

    if (!history) {
      throw new NotFoundException(
        'Subscription installment history does not exist',
      );
    }

    const subscription = history.subscription;

    if (!subscription) {
      throw new NotFoundException('Subscription does not exist');
    }

    if (
      subscription.price === null ||
      subscription.paid === null ||
      subscription.remaining === null
    ) {
      throw new BadRequestException(
        'The price, paid, or remaining value is set as null for this subscription.',
      );
    }

    const remaining =
      subscription.price - subscription.paid + history.paid - price;

    if (remaining > price)
      throw new BadRequestException(
        'The installment amount cannot be greater than the remaining price for this subscription.',
      );

    if (remaining < 0)
      throw new BadRequestException(
        'The remaining price after updating installment is negative. Please check the data consistency.',
      );

    const updatedHistory = await this.prisma.subscriptionHistory.update({
      where: { id },
      data: { paid: price },
    });

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        paid: subscription.paid - history.paid + price,
        remaining:
          subscription.price - subscription.paid + history.paid - price,
        updatedById: loggedUserData.id,
      },
    });

    const apartmentStatus = remaining === 0 ? 'paid' : 'due';

    await this.prisma.apartment.update({
      where: { id: subscription.apartmentId },
      data: { subscription: apartmentStatus },
    });

    return updatedHistory;
  }

  async deleteInstallment(data: DeleteParams) {
    const { id } = data;

    return this.prismaTrx.$transaction(async (prisma) => {
      const history = await prisma.subscriptionHistory.findUnique({
        where: { id },
      });

      if (!history) {
        throw new NotFoundException('Installment does not exist');
      }

      const subscription = await prisma.subscription.findFirst({
        where: { id: history.subscriptionId },
        include: {
          history: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      });

      if (subscription?.remaining === null) {
        throw new BadRequestException('Remaining value is set as null');
      }

      if (!subscription || subscription.history[0].id !== id) {
        throw new ForbiddenException(
          'You can only delete the latest installment history of the subscription.',
        );
      }

      await prisma.subscriptionHistory.delete({
        where: {
          id,
        },
      });

      await prisma.subscription.update({
        where: { id: history.subscriptionId },
        data: {
          paid: { decrement: history.paid },
          remaining: { increment: history.paid },
        },
      });

      const remaining = subscription.remaining + history.paid;

      const apartmentStatus = remaining === 0 ? 'paid' : 'due';

      await prisma.apartment.update({
        where: { id: subscription.apartmentId },
        data: { subscription: apartmentStatus },
      });

      return history;
    });
  }
}
