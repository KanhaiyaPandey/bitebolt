import { UserRole } from '@bitebolt/types';
import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../guards/jwt-auth.guard';
import { ROLES_KEY } from '../guards/roles.guard';

// Current authenticated user decorator
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

// Mark route as public (no auth required)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Restrict route to specific roles
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
