/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConsoleLogger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { getPageDocs, pagination } from 'src/common/utils/pagination.util';

const logger = new ConsoleLogger('Prisma Extension');

const findPrismaExtension = Prisma.defineExtension({
  model: {
    $allModels: {
      // Method to check if a appartmentId exist based on specific conditions
      async exists<T, A>(
        this: T,
        apartmentId: string,
        args: Prisma.Exact<A, Prisma.Args<T, 'findFirst'>>,
      ): Promise<Prisma.Result<T, A, 'findFirst'> | null> {
        const context = Prisma.getExtensionContext(this);

        try {
          // @ts-ignore: this works perfectly
          const { where, ...other } = args;

          const result = await (context as any).findFirst({
            ...other,
            where: {
              ...where,
              apartmentId,
            },
          });

          return result;
        } catch (error) {
          logger.error('Do not use this for the unwanted model', error);
          return null;
        }
      },

      // Method to check if a appartmentId exist based on specific conditions
      async existMany<T, A>(
        this: T,
        apartmentId: string,
        args: Prisma.Exact<A, Prisma.Args<T, 'findMany'>>,
      ): Promise<Prisma.Result<T, A, 'findMany'>> {
        const context = Prisma.getExtensionContext(this);

        try {
          // @ts-ignore: this works perfectly
          const { where, ...other } = args;

          const result = await (context as any).findMany({
            ...other,
            where: {
              ...where,
              apartmentId,
            },
          });

          return result;
        } catch (error) {
          logger.error('Do not use this for the unwanted model', error);
          return [] as any;
        }
      },

      // Method to get paginated data based on apartment Id compulsory
      async getAllPaginatedById<T, A>(
        this: T,
        props: {
          page?: number;
          limit?: number;
          apartmentId: string;
        },
        args: Prisma.Exact<A, Prisma.Args<T, 'findMany'>>,
      ): Promise<{
        data: Prisma.Result<T, A, 'findMany'>;
        docs: any;
      }> {
        const { apartmentId } = props;

        const { page, limit, skip } = pagination({
          page: props.page,
          limit: props.limit,
        });

        const context = Prisma.getExtensionContext(this);

        try {
          // @ts-ignore: this works perfectly
          const { where, ...other } = args;

          const [data, count] = await Promise.all([
            (context as any).findMany({
              ...other,
              where: {
                ...where,
                apartmentId,
              },
              take: limit,
              skip,
            }),
            (context as any).count({
              where: {
                ...where,
                apartmentId,
              },
            }),
          ]);

          const docs = getPageDocs({
            page,
            limit,
            count,
          });

          return {
            docs,
            data,
          };

          // return result;
        } catch (error) {
          logger.error('Do not use this for the unwanted model');
          return { docs: null, data: [] } as any;
        }
      },

      //Method to get paginated data
      async getAllPaginated<T, A>(
        this: T,
        props: { page?: number; limit?: number },
        args: Prisma.Exact<A, Prisma.Args<T, 'findMany'>>,
      ): Promise<{
        data: Prisma.Result<T, A, 'findMany'>;
        docs: any;
      }> {
        // @ts-ignore: this works perfectly
        const { where, ...other } = args;
        const { page, limit, skip } = pagination({
          page: props.page,
          limit: props.limit,
        });

        const context = Prisma.getExtensionContext(this);

        try {
          const [data, count] = await Promise.all([
            (context as any).findMany({
              ...other,
              where: {
                ...where,
              },
              take: limit,
              skip,
            }),
            (context as any).count({
              where: {
                ...where,
              },
            }),
          ]);

          const docs = getPageDocs({
            page,
            limit,
            count,
          });

          return {
            docs,
            data,
          };
        } catch (error) {
          logger.error('Do not use this for the unwanted model');
          return { docs: null, data: [] } as any;
        }
      },
    },
  },
});

export default findPrismaExtension;
