import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from '../services';
import {
  AddItemBody,
  AddShippingAddressBody,
  CreateOrderBody,
  OrdersQuery,
  PlaceOrderBody,
  RemoveItemBody,
  UpdateItemBody,
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

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Patch('order/:id/remove-item')
  async handleRemoveItem(
    @Body() body: RemoveItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.removeItem(body, jwtPayload.id, id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Patch('order/:id/update-item')
  async handleUpdateItem(
    @Body() body: UpdateItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.updateItem(body, jwtPayload.id, id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Post('order/:id/place')
  async handlePlaceOrder(
    @Body() body: PlaceOrderBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.placeOrder(body, jwtPayload.id, id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Get('order')
  async handleGetOrders(
    @JWTPayload() jwtPayload: JWTPayload,
    @Query() query: OrdersQuery
  ) {
    return this.orderService.queryOrders(query, jwtPayload.id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Get('order/:id')
  async handleGetOrder(
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.fetchOrderById(id, jwtPayload.id);
  }
}
