import { randomBytes } from 'node:crypto';

export function generateTicketId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomNumber = Math.floor(Math.random() * 900000) + 100000; // Generate 6-digit number
  const randomLetter = letters.charAt(
    Math.floor(Math.random() * letters.length),
  );
  const ticketId = randomLetter + randomNumber.toString();

  return ticketId.toString();
}

export function generateGatePassId(): string {
  const randomBytesNumber =
    (parseInt(randomBytes(3).toString('hex'), 16) % 900000) + 100000;
  return randomBytesNumber.toString();
}

export function generateClientNumberId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomNumber = Math.floor(Math.random() * 900000) + 100000; // Generate 6-digit number
  const randomLetter = letters.charAt(
    Math.floor(Math.random() * letters.length),
  );
  const id = 'Offline-' + randomLetter + randomNumber.toString();

  return id.toString();
}
