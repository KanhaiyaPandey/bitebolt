import { UserRole } from '@bitebolt/types';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() body: { name?: string; email?: string },
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Patch('me/push-token')
  updatePushToken(@CurrentUser() user: { id: string }, @Body() body: { token: string | null }) {
    return this.usersService.updatePushToken(user.id, body.token);
  }

  @Get('me/addresses')
  getAddresses(@CurrentUser() user: { id: string }) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('me/addresses')
  addAddress(@CurrentUser() user: { id: string }, @Body() body: any) {
    return this.usersService.addAddress(user.id, body);
  }

  @Patch('me/addresses/:id')
  updateAddress(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() body: any) {
    return this.usersService.updateAddress(user.id, id, body);
  }

  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.id, id);
  }

  // ── Admin Routes ─────────────────────────────────────────────────────────────

  @Get('admin/customers')
  @Roles(UserRole.ADMIN)
  getCustomers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.usersService.getCustomers(+page, +limit, search);
  }

  @Get('admin/customers/:id')
  @Roles(UserRole.ADMIN)
  getCustomerById(@Param('id') id: string) {
    return this.usersService.getCustomerById(id);
  }
}
