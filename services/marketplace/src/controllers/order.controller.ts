import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
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
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags(Order.name)
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@UseGuards(Authenticated)
@Controller()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly amqpConnection: AmqpConnection
  ) {}

  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Not enough stock for a given product/s.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['customer'])
  @Post('order')
  async handleOrder(
    @Body() body: CreateOrderBody,
    @JWTPayload() jwtPayload: JWTPayload
  ) {
    return this.orderService.createOrder(body, jwtPayload.id);
  }

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Order is not in drafting status.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['admin', 'customer'])
  @Delete('order/:id/cancel')
  async handleCancelOrder(
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.cancelOrder(id, this.getUserId(jwtPayload));
  }

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Order is not in drafting status.',
  })
  @ApiOkResponse({ type: Order })
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

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order or product not found / Item is already in order.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Order is not in drafting status.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['customer', 'admin'])
  @Patch('order/:id/add-item')
  async handleAddItem(
    @Body() body: AddItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.addItem(body, id, this.getUserId(jwtPayload));
  }

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Order or product not found / Item is not in order. / Product not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Order is not in drafting status.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['customer', 'admin'])
  @Patch('order/:id/remove-item')
  async handleRemoveItem(
    @Body() body: RemoveItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.removeItem(body, id, this.getUserId(jwtPayload));
  }

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Order or product not found / Item is not the in order. / Product not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Order is not in drafting status.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['customer', 'admin'])
  @Patch('order/:id/update-item')
  async handleUpdateItem(
    @Body() body: UpdateItemBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.updateItem(body, id, this.getUserId(jwtPayload));
  }

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Order is not in drafting or failed-payment status./ Order does not have shipping address.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['customer', 'admin'])
  @Post('order/:id/place')
  async handlePlaceOrder(
    @Body() body: PlaceOrderBody,
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.placeOrder(body, id, this.getUserId(jwtPayload));
  }

  @ApiOkResponse({ type: [Order] })
  @Roles(['customer'])
  @Get('order')
  async handleGetOrders(
    @JWTPayload() jwtPayload: JWTPayload,
    @Query() query: OrdersQuery
  ) {
    return this.orderService.queryOrders(query, jwtPayload.id);
  }

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['customer'])
  @Get('order/:id')
  async handleFetchOrderById(
    @JWTPayload() jwtPayload: JWTPayload,
    @Param('id') id: string
  ) {
    return this.orderService.fetchOrderById(id, jwtPayload.id);
  }

  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Not enough stock for a given product/s.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['admin'])
  @Post('admin/order')
  async handleAdminCreateOrder(@Body() body: CreateAdminOrderBody) {
    const user = await this.amqpConnection.request<User>({
      exchange: 'auth.create-or-get-user',
      routingKey: '',
      payload: {
        email: body.customerEmail,
      },
    });

    return this.orderService.createOrder(body, user.id, true);
  }

  @ApiOkResponse({ type: [Order] })
  @Roles(['admin'])
  @Get('admin/order')
  async handleAdminGetOrders(@Query() query: OrdersQuery) {
    return this.orderService.queryOrders(query);
  }

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiOkResponse({ type: Order })
  @Roles(['admin'])
  @Get('admin/order/:id')
  async handleAdminGetOrder(@Param('id') id: string) {
    return this.orderService.fetchOrderById(id);
  }

  private getUserId(jwtPayload: JWTPayload) {
    return jwtPayload.roles.includes('admin') ? undefined : jwtPayload.id;
  }
}
