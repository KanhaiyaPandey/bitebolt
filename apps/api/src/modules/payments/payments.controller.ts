import { Body, Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';

import { Public, CurrentUser } from '../../common/decorators';

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
}
