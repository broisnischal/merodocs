import {
  ArgumentsHost,
  Catch,
  ConsoleLogger,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { error } from 'console';
import { EnvService } from 'src/global/env/env.service';
import { ZodError } from 'zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new ConsoleLogger();
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly envService: EnvService,
  ) {}
  catch(exception: HttpException | ZodError | Error, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let httpStatus: HttpStatus;
    let message: string;

    // @ts-ignore

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      message = exception.message;
    } else if (error instanceof ZodError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = error.issues[0].message;
    } else {
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';

      this.logger.error(exception.stack);
    }

    const responseBody = {
      status: false,
      message,
      // ...(typeof err === 'string' ? { err } : { ...err }),
      stack:
        this.envService.get('NODE_ENV') !== 'production' && exception.stack,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
