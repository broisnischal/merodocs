import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { GetAllParams, GetParam } from 'src/api/superadmin/common/interface';
import { ProblemStatus } from '@prisma/client';
import { updateProblemDto } from './dtos/update-problem.dto';
import { UpdateParams } from 'src/api/superadmin/common/interface';
import {
  generateReportResolvedTemplate,
  generateReportWorkingOnTemplate,
} from 'src/templates/superadmin/report-update.template';
import { MailService } from 'src/global/mail/mail.service';

@Injectable()
export class ProblemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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
      whereCondition.apartment = {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      };
    }

    const problems = await this.prisma.problem.getAllPaginated(
      { limit, page },
      {
        where: whereCondition,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          topic: true,
          status: true,
          createdAt: true,
          createdBy: {
            select: {
              name: true,
              contact: true,
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
          updatedAt: true,
          updatedBy: {
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
        },
      },
    );

    return problems;
  }

  async getSingle(data: GetParam) {
    const { id } = data;

    const problem = await this.prisma.problem.findFirst({
      where: { id },
      select: {
        id: true,
        updatedBy: {
          select: {
            name: true,
            image: {
              select: { url: true },
            },
          },
        },
      },
    });

    if (!problem) throw new NotFoundException('Problem doesnot exist');

    return problem;
  }

  async update(data: UpdateParams<updateProblemDto>) {
    const { id, postData, loggedUserData } = data;

    const { status } = postData;

    const valid = await this.prisma.problem.findFirst({
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

    const problem = await this.prisma.problem.update({
      where: { id },
      data: {
        status,
        updatedById: loggedUserData?.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (
      problem.createdBy &&
      (problem.status === 'working_on_it' || problem.status === 'ticket_closed')
    ) {
      let template: string;

      if (problem.status === 'working_on_it') {
        template = generateReportWorkingOnTemplate({
          name: problem.createdBy?.name ? problem.createdBy.name : '',
          title: problem.topic,
          url: 'reports-feedback',
        });
      } else {
        template = generateReportResolvedTemplate({
          name: problem.createdBy?.name ? problem.createdBy.name : '',
          title: problem.topic,
          url: 'reports-feedback',
        });
      }

      await this.mailService.sendMail({
        template,
        to: problem.createdBy.email,
        type: 'reporting-update',
      });
    }

    return problem;
  }
}
