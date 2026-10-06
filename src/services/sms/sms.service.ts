import { autoInjectable } from 'tsyringe';
import { logger } from '../../config/logger.config';

@autoInjectable()
export class SmsService {
  /**
   * Send an OTP code to a mobile phone number.
   * In development/testing: logs the OTP to console/logger and returns true.
   * In production: ready for integration with an SMS gateway (Twilio, Sparrow SMS, AWS SNS, etc.)
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    // [DEVELOPMENT MODE]: Log the OTP for testing purposes
    logger.info(
      `[SmsService] Simulated SMS dispatch -> Phone: ${phoneNumber} | OTP: ${otp}`,
    );

    // TODO: Integrate external SMS provider API here
    // Example:
    // await twilioClient.messages.create({
    //   body: `Your Otherly verification code is: ${otp}. Valid for 5 minutes.`,
    //   to: phoneNumber,
    //   from: DotenvConfig.TWILIO_PHONE_NUMBER,
    // });

    return true;
  }
}
