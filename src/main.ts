import { ConsoleLogger, VersioningType } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { EnvService } from './global/env/env.service';
import { CustomZodValidationPipe } from './common/pipelines';
import { ZodValidationExceptionFilter } from './common/pipelines/zod-validation-exception';
import * as requestIp from 'request-ip';
import * as geoip from 'geoip-lite';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.use(compression());
  app.use(
    helmet({
      xssFilter: true,
      frameguard: { action: 'deny' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
      noSniff: true,
    }),
  );

  const logger = app.get(ConsoleLogger);

  morgan.token('real-ip', (req) => {
    const ip = requestIp.getClientIp(req) || '';
    return ip;
  });

  morgan.token('geo', (req) => {
    const ip = requestIp.getClientIp(req) || '';
    const geo = geoip.lookup(ip);
    return geo
      ? `${geo.country}, ${geo.city}, ${geo.region}, ${geo.ll} - ${geo.timezone}`
      : 'N/A';
  });

  app.use(
    morgan(':real-ip :geo :method :url :status - :response-time ms', {
      stream: {
        write: (str) => {
          logger.log(str.replace('\n', ''), 'RouterLogger');
        },
      },
    }),
  );

  const httpAdapterHost = app.get(HttpAdapterHost);
  const envConfig = app.get(EnvService);

  app.useGlobalInterceptors(new TimeoutInterceptor());

  app.useGlobalPipes(new CustomZodValidationPipe());

  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost, envConfig));

  app.useGlobalFilters(new ZodValidationExceptionFilter());

  await app.listen(envConfig.get('PORT'));

  logger.log(`Listening on ${envConfig.get('PORT')}`, 'ServerLoader');
}
bootstrap();
