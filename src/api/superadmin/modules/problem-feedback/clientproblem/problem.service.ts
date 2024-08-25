import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams } from 'src/api/superadmin/common/interface';
import { ProblemStatus } from '@prisma/client';
import { updateProblemDto } from './dtos/update-problem.dto';
import { UpdateParams } from 'src/api/superadmin/common/interface';

@Injectable()
export class ClientProblemService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(data: GetAllParams) {
    const { page, limit, filter, q } = data;

    const isFilterValid = Object.values(ProblemStatus).includes(
      filter as ProblemStatus,
    );

    const whereCondition: any = filter ? { status: filter } : {};

    if (filter && !isFilterValid) {
      throw new NotFoundException('Filter does not exist');
    }

    if (q) {
      whereCondition.createdBy = {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      };
    }

    const problems = await this.prisma.clientProblem.getAllPaginated(
      { limit, page },
      {
        where: whereCondition,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          problemId: true,
          status: true,
          apartment: {
            select: {
              name: true,
              area: true,
              city: true,
              country: true,
              postalcode: true,
              province: true,
            },
          },
          createdBy: {
            select: {
              name: true,
              contact: true,
              image: {
                select: {
                  url: true,
                },
              },
            },
          },
          message: true,
          attachments: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          createdAt: true,
        },
      },
    );

    return problems;
  }

  async update(data: UpdateParams<updateProblemDto>) {
    const { id, postData } = data;

    const { status } = postData;

    const valid = await this.prisma.clientProblem.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Problem doesnot exist');

    let allowedTransitions: string[] = [];

    switch (valid.status) {
      case 'pending':
        allowedTransitions = ['valid_issue', 'inappropriate_issue'];
        break;
      case 'valid_issue':
        allowedTransitions = ['inappropriate_issue', 'working_on_it'];
        break;
      case 'inappropriate_issue':
        allowedTransitions = ['valid_issue'];
        break;
      case 'working_on_it':
        allowedTransitions = ['ticket_closed'];
        break;
      case 'ticket_closed':
        throw new BadRequestException(
          'No transitions allowed from ticket closed',
        );
    }

    if (!allowedTransitions.includes(status)) {
      throw new BadRequestException(
        `Invalid transition from ${valid.status} to ${status}`,
      );
    }

    const problem = await this.prisma.clientProblem.update({
      where: { id },
      data: {
        status,
      },
    });

    return problem;
  }
}
