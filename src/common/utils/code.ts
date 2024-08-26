import crypto from 'node:crypto';

export function generateRandomCode(length: number) {
  const digits = '0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    code += digits[randomIndex];
  }

  return code;
}
