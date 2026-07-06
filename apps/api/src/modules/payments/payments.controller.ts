import { UserRole } from '@bitebolt/types';
import { Body, Controller, Get, Headers, Post, Query, RawBodyRequest, Req } from '@nestjs/common';

import { CurrentUser, Public, Roles } from '../../common/decorators';

import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  createOrder(@CurrentUser() user: { id: string }, @Body() dto: CreateRazorpayOrderDto) {
    return this.paymentsService.createRazorpayOrder(user.id, dto);
  }

  @Post('verify')
  verifyPayment(@CurrentUser() user: { id: string }, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(user.id, dto);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const payload = req.rawBody?.toString() ?? '';
    return this.paymentsService.handleWebhook(payload, signature);
  }

  // ── Admin Route ──────────────────────────────────────────────────────────────

  @Get('admin')
  @Roles(UserRole.ADMIN)
  getAllPayments(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('method') method?: string,
  ) {
    const safePage = Math.max(1, Math.floor(Number(page)) || 1);
    const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 20));
    return this.paymentsService.getAllPayments(safePage, safeLimit, status, method);
  }
}
