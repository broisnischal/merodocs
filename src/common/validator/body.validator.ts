// import parsePhoneNumberFromString from 'libphonenumber-js';
import { capitalize } from 'lodash';
import { z } from 'zod';

export const stringSchema = (
  type: 'name' | 'title' | 'description',
  lower: boolean = true,
) => {
  const schema = z
    .string({ required_error: `${capitalize(type)} is required` })
    .trim()
    .min(1, `${capitalize(type)} is required`)
    .max(type === 'name' ? 50 : 255, `${capitalize(type)} is too long`);

  return lower ? schema.toLowerCase() : schema;
};

export const contactSchema = () => {
  return z.string({ required_error: 'Contact is required' });
  // .refine((value) => /^\+[0-9]{10}$/.test(value), {
  //   message: 'Invalid Contact Number',
  // });
  // .refine(
  //   (value) => {
  //     const phone = parsePhoneNumberFromString(value, {
  //       defaultCountry: 'NP',
  //       extract: false,
  //     });

  //     return phone?.isValid();
  //   },
  //   {
  //     message: 'Invalid Contact Number',
  //   },
  // );
};
