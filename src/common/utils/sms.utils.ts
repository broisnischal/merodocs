import axios from 'axios';

interface SmsResponseParams {
  token: string;
  from: string;
  to: string;
  text: string;
}

export const smsResponse = async ({
  token,
  from,
  to,
  text,
}: SmsResponseParams): Promise<any> => {
  try {
    const response = await axios.post('http://api.sparrowsms.com/v2/sms/', {
      token,
      from,
      to,
      text,
    });
    return response.data;
  } catch (err) {
    console.error(err, 'errs');
    return {
      status: false,
      message: 'Something went wrong',
      error: err,
    };
  }
};
