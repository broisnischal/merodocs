import 'dotenv/config';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { envSchema, envType } from './env-config.dto';

@Injectable()
export class EnvService {
  private readonly env: envType;
  private readonly logger = new ConsoleLogger(EnvService.name);

  constructor() {
    const parsedEnv = envSchema.safeParse(process.env);

    if (parsedEnv.success === false) {
      this.logger.fatal('Error while Loading the Env');

      console.error(parsedEnv.error.message);
      process.exit(1);
    }

    this.env = envSchema.parse(process.env);

    this.logger.log('Environment Variables Loaded');
  }

  get<K extends keyof envType>(key: K): envType[K] {
    return this.env[key];
  }
}
