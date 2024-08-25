import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  ConsoleLogger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EnvService } from '../env/env.service';

const Title = 'VMS International';

const MailTitle = {
  'email-verify': `Verify Email - ${Title}`,
  'password-reset': `Reset Password - ${Title}`,
  // 'reporting-working-on': `Reporting Working On - ${Title}`,
  'reporting-update': `Update on Report - ${Title}`,
  'change-number': `Change Number - ${Title}`,
};

type MailProps = {
  to: string | string[];
  template: string;
  type: keyof typeof MailTitle;
};

@Injectable()
export class MailService {
  private readonly logger = new ConsoleLogger(MailService.name);
  private sesClient: SESClient;

  constructor(private readonly envService: EnvService) {
    this.sesClient = new SESClient({
      region: this.envService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.logger.log('Successfully initialized mail service');
  }

  async sendMail(props: MailProps): Promise<void> {
    const { to, template, type } = props;

    const command = new SendEmailCommand({
      Source: `${Title} <${this.envService.get('EMAIL_SENDER')}>`,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: MailTitle[type],
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: template,
          },
        },
      },
    });

    try {
      await this.sesClient.send(command);
    } catch (err) {
      this.logger.error('Error while sending mail', err);
      throw new InternalServerErrorException(
        'Error while trying to send email. Please try again!',
      );
    }
  }
}
