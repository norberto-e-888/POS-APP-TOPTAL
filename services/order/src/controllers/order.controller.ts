import {
  Body,
  Controller,
  Delete,
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
import { Order, User } from '@pos-app/models';
import { ApiTags } from '@nestjs/swagger';

@UseGuards(Authenticated)
@ApiTags(Order.name)
@Controller()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly amqpConnection: AmqpConnection
  ) {}

  @Roles(['customer'])
  @Post('order')
  async handleOrder(
    @Body() body: CreateOrderBody,
    @JWTPayload() jwtPayload: JWTPayload
  ) {
    return this.orderService.createOrder(body, jwtPayload.id);
  }

  @Roles(['admin', 'customer'])
  @Delete('order/:id/cancel')
  async handleCancelOrder(
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.cancelOrder(id, this.getUserId(jwtPayload));
  }

  @Roles(['customer', 'admin'])
  @Patch('order/:id/shipping-address')
  async handleAddShippingAddress(
    @Body() body: AddShippingAddressBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.addShippingAddress(
      body,
      id,
      this.getUserId(jwtPayload)
    );
  }

  @Roles(['customer', 'admin'])
  @Patch('order/:id/add-item')
  async handleAddItem(
    @Body() body: AddItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.addItem(body, id, this.getUserId(jwtPayload));
  }

  @Roles(['customer', 'admin'])
  @Patch('order/:id/remove-item')
  async handleRemoveItem(
    @Body() body: RemoveItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.removeItem(body, id, this.getUserId(jwtPayload));
  }

  @Roles(['customer', 'admin'])
  @Patch('order/:id/update-item')
  async handleUpdateItem(
    @Body() body: UpdateItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.updateItem(body, id, this.getUserId(jwtPayload));
  }

  @Roles(['customer', 'admin'])
  @Post('order/:id/place')
  async handlePlaceOrder(
    @Body() body: PlaceOrderBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.placeOrder(body, id, this.getUserId(jwtPayload));
  }

  @Roles(['customer'])
  @Get('order')
  async handleGetOrders(
    @JWTPayload() jwtPayload: JWTPayload,
    @Query() query: OrdersQuery
  ) {
    return this.orderService.queryOrders(query, jwtPayload.id);
  }

  @Roles(['customer'])
  @Get('order/:id')
  async handleGetOrder(
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.fetchOrderById(id, jwtPayload.id);
  }

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

    return this.orderService.createOrder(body, user.id, true);
  }

  @Roles(['admin'])
  @Get('admin/order')
  async handleAdminGetOrders(@Query() query: OrdersQuery) {
    return this.orderService.queryOrders(query);
  }

  @Roles(['admin'])
  @Get('admin/order/:id')
  async handleAdminGetOrder(@Param('id') id: string) {
    return this.orderService.fetchOrderById(id);
  }

  private getUserId(jwtPayload: JWTPayload) {
    return jwtPayload.roles.includes('admin') ? undefined : jwtPayload.id;
  }
}
