import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { generateOTP } from 'src/api/client/common/utils/otp.utils';
// import { smsResponse } from 'src/common/utils/sms.utils';

@Injectable()
export class OTPService {
  async createOtp(phone: string) {
    const generateOtp = generateOTP(6);

    const ttl = parseInt(process.env.OTP_TIME_LIMIT!) || 120000; // 2 min

    const expires = Date.now() + ttl;

    const data = `${phone}.${generateOtp}.${expires}`;

    const hash = crypto
      .createHmac('sha256', process.env.OTP_SECRET!)
      .update(data)
      .digest('hex');

    const fullHash = `${hash}.${expires}`;

    // const token = process.env.SPARROW_SMS_TOKEN;
    // const from = 'Demo'; // Replace with your desired sender ID
    // const to = phone;
    // const text = `${generateOtp} is your verification code for Connect Home. Please do not share this code with anyone.`;

    // try {
    //   await smsResponse({ token, from, to, text });
    // } catch (error) {
    //   console.error('Error sending OTP via Sparrow SMS:', error);
    //   throw new Error('Failed to send OTP');
    // }

    //TODO: Remove this response
    return {
      hash: fullHash,
      otp: generateOtp,
      phone,
    };
  }

  async verifyOtp({
    phone,
    otp,
    hash,
  }: {
    phone: string;
    otp: string;
    hash: string;
  }) {
    const [hashValue, expires] = hash.split('.');

    let now = Date.now();

    if (now > parseInt(expires)) {
      return false;
    }

    const data = `${phone}.${otp}.${expires}`;

    try {
      let newCalculatedHash = crypto
        .createHmac('sha256', process.env.OTP_SECRET!)
        .update(data)
        .digest('hex');

      if (newCalculatedHash === hashValue) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
