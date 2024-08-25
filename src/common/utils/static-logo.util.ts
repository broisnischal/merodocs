import { ClientNotificationLogoEnum } from '@prisma/client';

const CLOUDFRONT = process.env.CLOUDFRONT + 'static/';

export function generateLogo(logo: ClientNotificationLogoEnum): string {
  switch (logo) {
    case 'in': {
      return CLOUDFRONT + 'checkin.png';
    }
    case 'out': {
      return CLOUDFRONT + 'checkout.png';
    }
    case 'approved': {
      return CLOUDFRONT + 'approve.png';
    }
    case 'rejected': {
      return CLOUDFRONT + 'reject.png';
    }
    case 'delivery': {
      return CLOUDFRONT + 'delivery.png';
    }
    case 'ride': {
      return CLOUDFRONT + 'ride.png';
    }
    case 'parcel': {
      return CLOUDFRONT + 'parcel.png';
    }
    case 'guest': {
      return CLOUDFRONT + 'guest.png';
    }
    case 'service': {
      return CLOUDFRONT + 'service.png';
    }
    case 'sos': {
      return CLOUDFRONT + 'sos.png';
    }
    default: {
      return '';
    }
  }
}
