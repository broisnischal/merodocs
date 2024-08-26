import { PrismaClient } from '@prisma/client';
import findPrismaExtension from './extensions/find-prisma.extension';

export const prisma = new PrismaClient();

export function extendedClient() {
  const extendPrismaClient = () => prisma.$extends(findPrismaExtension);

  return new Proxy(class {}, {
    construct(target, args, newTarget) {
      return Object.assign(
        Reflect.construct(target, args, newTarget),
        extendPrismaClient(),
      );
    },
  }) as new () => ReturnType<typeof extendPrismaClient>;
}
