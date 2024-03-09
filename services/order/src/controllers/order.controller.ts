import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OrderService } from '../services';
import { CreateOrderBody } from '../validators';
import { Authenticated, JWTPayload } from '@pos-app/auth';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(Authenticated)
  @Post('order')
  async handleOrder(
    @Body() body: CreateOrderBody,
    @JWTPayload() jwtPayload: JWTPayload
  ) {
    return this.orderService.createOrder(body, jwtPayload.id);
  }
}
