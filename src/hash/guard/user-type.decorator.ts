import { SetMetadata } from '@nestjs/common';

export const UserType = (...roles: string[]) => SetMetadata('roles', roles);
