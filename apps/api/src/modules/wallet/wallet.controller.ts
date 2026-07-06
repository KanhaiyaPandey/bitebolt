import { UserRole } from '@bitebolt/types';
import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';

import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser() user: { id: string }) {
    return this.walletService.getWallet(user.id);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser() user: { id: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.walletService.getTransactions(user.id, +page, +limit);
  }

  // ── Admin Route ──────────────────────────────────────────────────────────────

  @Get('admin/transactions')
  @Roles(UserRole.ADMIN)
  getAllTransactions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    return this.walletService.getAllTransactions(+page, +limit, userId, type);
  }
}
