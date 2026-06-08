import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators';

import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: { id: string }) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  addItem(
    @CurrentUser() user: { id: string },
    @Body() body: { foodItemId: string; quantity: number; specialInstructions?: string },
  ) {
    return this.cartService.addToCart(user.id, body);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItem(user.id, id, quantity);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.cartService.updateItem(user.id, id, 0);
  }

  @Delete()
  clearCart(@CurrentUser() user: { id: string }) {
    return this.cartService.clearCart(user.id);
  }
}
