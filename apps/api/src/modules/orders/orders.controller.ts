import { UserRole } from '@bitebolt/types';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';

import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── Customer Routes ──────────────────────────────────────────────────────────

  @Post()
  placeOrder(@CurrentUser() user: { id: string }, @Body() dto: PlaceOrderDto) {
    return this.ordersService.placeOrder(user.id, dto);
  }

  @Get()
  getMyOrders(
    @CurrentUser() user: { id: string },
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.ordersService.getUserOrders(user.id, +page, +limit);
  }

  @Get(':id')
  getOrder(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.ordersService.getOrderById(user.id, id);
  }

  @Patch(':id/cancel')
  cancelOrder(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.ordersService.cancelOrder(user.id, id);
  }

  // ── Admin Routes ─────────────────────────────────────────────────────────────

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  getAllOrders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.ordersService.getAllOrders(+page, +limit, status);
  }

  @Get('admin/:id')
  @Roles(UserRole.ADMIN)
  getOrderAdmin(@Param('id') id: string) {
    return this.ordersService.getOrderByIdForAdmin(id);
  }

  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN)
  updateOrderStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, dto);
  }
}
