import crypto from 'node:crypto';

const algorithm = 'aes-256-cbc';
const secretKey = `dS%xx_kUlS9Ud2a9A/-+q$Lo7TNXi6!H`;
const seperator = '-secret-iv-end:';

export function encrypt(data: string): string {
  const iv = crypto.randomBytes(16); // Dynamically generate IV
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(data, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  // Concatenate IV and encrypted data
  return iv.toString('hex') + seperator + encrypted;
}

export function decrypt(encryptedDataWithIV: string): string {
  const [ivHex, encryptedData] = encryptedDataWithIV.split(seperator); // Split IV and encrypted data
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey),
    iv,
  );
  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}
