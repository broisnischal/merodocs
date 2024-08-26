import { FolderTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const folderParamSchema = z.object({
  type: z.nativeEnum(FolderTypeEnum, { required_error: 'Type is required' }),
  id: z.string({ required_error: 'Id is required' }).uuid().optional(),
});

export class folderParamDto extends createZodDto(folderParamSchema) {}
