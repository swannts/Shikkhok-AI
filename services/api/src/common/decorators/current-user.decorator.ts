import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the authenticated user from the request object.
 * Requires JwtAuthGuard to be applied on the route.
 *
 * Usage:
 *   @Get('me')
 *   @UseGuards(JwtAuthGuard)
 *   getProfile(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If a specific property is requested, return only that property
    if (data) {
      return user?.[data];
    }
    return user;
  },
);
