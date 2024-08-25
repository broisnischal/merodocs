import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';
import { updateProblemDto } from './dtos/index.dto';
import { ParamId } from 'src/common/decorators';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { SuperAdmin } from '@prisma/client';

@Controller('problem')
export class ProblemController {
  constructor(private readonly service: ProblemService) {}

  @Get('')
  async getAll(
    @Query() { page, limit, filter, q }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({ page, limit, filter, q });

    return new HttpResponse({
      data,
    });
  }

  @Get('/:id')
  async getSingle(@ParamId() id: string): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateProblemDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Status updated successfully',
      data,
    });
  }
}
