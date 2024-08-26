import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { FAQTypeEnum } from '@prisma/client';

@Injectable()
export class FAQService {
  constructor(private readonly prisma: PrismaService) {}

  async get(data: { forType: FAQTypeEnum }) {
    const { forType } = data;

    const faqs = await this.prisma.fAQ.findMany({
      where: {
        for: forType,
      },
      select: {
        question: true,
        answer: true,
      },
    });

    return faqs;
  }

  async getAll() {
    const faqs = await this.prisma.fAQ.groupBy({
      by: ['for'],
    });

    const groupedFaqs = Object.fromEntries(
      await Promise.all(
        faqs.map(async (group) => [
          group.for,
          await this.prisma.fAQ.findMany({
            where: { for: group.for },
            select: { question: true, answer: true },
            orderBy: { createdAt: 'desc' },
          }),
        ]),
      ),
    );

    return groupedFaqs;
  }
}
