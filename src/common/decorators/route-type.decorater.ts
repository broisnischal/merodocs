import { SetMetadata } from '@nestjs/common';

export const Private = () => SetMetadata('isPrivate', true);

export const Public = () => SetMetadata('isPublic', true);
