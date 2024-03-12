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
  CreateAdminOrderBody,
  CreateOrderBody,
  OrdersQuery,
  PlaceOrderBody,
  RemoveItemBody,
  UpdateItemBody,
} from '../validators';
import { Authenticated, JWTPayload, Roles } from '@pos-app/auth';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { User } from '@pos-app/models';

@Controller()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly amqpConnection: AmqpConnection
  ) {}

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
  @Roles(['admin'])
  @Post('admin/order')
  async handleAdminOrder(@Body() body: CreateAdminOrderBody) {
    const user = await this.amqpConnection.request<User>({
      exchange: 'auth.create-or-get-user',
      routingKey: '',
      payload: {
        email: body.customerEmail,
      },
    });

    console.log('USER', user);

    return this.orderService.createOrder(body, user.id, true);
  }

  @UseGuards(Authenticated)
  @Roles(['customer', 'admin'])
  @Patch('order/:id/shipping-address')
  async handleAddShippingAddress(
    @Body() body: AddShippingAddressBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.addShippingAddress(body, jwtPayload.id, id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer', 'admin'])
  @Patch('order/:id/add-item')
  async handleAddItem(
    @Body() body: AddItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.addItem(body, jwtPayload.id, id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer', 'admin'])
  @Patch('order/:id/remove-item')
  async handleRemoveItem(
    @Body() body: RemoveItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.removeItem(body, jwtPayload.id, id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer', 'admin'])
  @Patch('order/:id/update-item')
  async handleUpdateItem(
    @Body() body: UpdateItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.updateItem(body, jwtPayload.id, id);
  }

  @UseGuards(Authenticated)
  @Roles(['customer', 'admin'])
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

  @UseGuards(Authenticated)
  @Roles(['admin'])
  @Get('admin/order')
  async handleAdminGetOrders(@Query() query: OrdersQuery) {
    return this.orderService.queryOrders(query);
  }

  @UseGuards(Authenticated)
  @Roles(['admin'])
  @Get('admin/order/:id')
  async handleAdminGetOrder(@Param('id') id: string) {
    return this.orderService.fetchOrderById(id);
  }
}
