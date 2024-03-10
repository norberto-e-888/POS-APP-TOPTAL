import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from '../services';
import {
  AddItemBody,
  AddShippingAddressBody,
  CreateOrderBody,
} from '../validators';
import { Authenticated, JWTPayload, Roles } from '@pos-app/auth';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Post('order')
  async handleOrder(
    @Body() body: CreateOrderBody,
    @JWTPayload() jwtPayload: JWTPayload
  ) {
    return this.orderService.createOrder(body, jwtPayload.id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Patch('order/:id/shipping-address')
  async handleAddShippingAddress(
    @Body() body: AddShippingAddressBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.addShippingAddress(body, jwtPayload.id, id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Patch('order/:id/add-item')
  async handleAddItem(
    @Body() body: AddItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.addItem(body, jwtPayload.id, id);
  }
}
