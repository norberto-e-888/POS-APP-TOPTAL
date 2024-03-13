import {
  Order,
  OrderStatus,
  OrderType,
  Product,
  getOrderhHash,
} from '@pos-app/models';
import { OutboxService } from '@pos-app/outbox';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  AddItemBody,
  AddShippingAddressBody,
  CreateOrderBody,
  OrdersQuery,
  PlaceOrderBody,
  RemoveItemBody,
  UpdateItemBody,
} from '../validators';
import { Exchange } from '../app/amqp';
import { defaultPagination } from '@pos-app/utils';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    private readonly outboxService: OutboxService
  ) {}

  async createOrder(dto: CreateOrderBody, userId: string, isAdmin?: boolean) {
    const { items } = dto;
    const orderType = isAdmin ? OrderType.IN_STORE : OrderType.ONLINE;

    return this.outboxService.publish(
      async (session) => {
        await Promise.all(
          items.map(async (item) => {
            const { productId, quantity } = item;

            const product = await this.productModel.findById(productId);

            if (!product) {
              throw new HttpException(
                `Product with id ${productId} not found.`,
                HttpStatus.NOT_FOUND
              );
            }

            await this.productModel.updateOne(
              { _id: productId },
              {
                $inc: {
                  'stock.reservedQuantity': quantity,
                },
              },
              { session }
            );
          })
        );

        const products = await this.productModel.find(
          {
            _id: { $in: items.map((item) => item.productId) },
          },
          undefined,
          { session }
        );

        const unavailableProducts = products.filter(
          (product) =>
            !(product.stock.availableQuantity >= product.stock.reservedQuantity)
        );

        if (unavailableProducts.length) {
          throw new HttpException(
            `The following products are unavailable given their respective requested quantities: ${unavailableProducts.reduce(
              (list, product, i) =>
                i < unavailableProducts.length - 1
                  ? list + ` ${product.name},`
                  : list + ` ${product.name}.`,
              ''
            )}`,
            HttpStatus.BAD_REQUEST
          );
        }

        const [order] = await this.orderModel.create(
          [
            {
              customerId: userId,
              shippingAddress: dto.shippingAddress,
              items,
              type: orderType,
            },
          ],
          {
            session,
          }
        );

        return order.toObject();
      },
      {
        exchange: Exchange.OrderCreated,
        routingKey: orderType,
      }
    );
  }

  async cancelOrder(orderId: string, userId?: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order || (userId && order.customerId !== userId)) {
      throw new HttpException(
        `Order with id ${orderId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    if (order.status !== OrderStatus.DRAFTING) {
      throw new HttpException(
        `Order with id ${orderId} is not in the drafting status.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const result = await this.outboxService.publish(
      async (session) => {
        await Promise.all(
          order.items.map(async (item) => {
            await this.productModel.updateOne(
              { _id: item.productId },
              {
                $inc: {
                  'stock.availableQuantity': item.quantity,
                  'stock.reservedQuantity': item.quantity * -1,
                },
              },
              { session }
            );
          })
        );

        order.status = OrderStatus.CANCELLED;

        await order.save({ session });

        return order.toObject();
      },
      {
        exchange: Exchange.OrderCancelled,
        routingKey: `${order.shippingAddress.country}.${order.shippingAddress.state}.${order.shippingAddress.city}.${order.shippingAddress.zip}.${order.type}`,
      }
    );

    return result;
  }

  async addShippingAddress(
    { shippingAddress }: AddShippingAddressBody,
    orderId: string,
    userId?: string
  ) {
    const order = await this.orderModel.findById(orderId);

    if (!order || (userId && order.customerId !== userId)) {
      throw new HttpException(
        `Order with id ${orderId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    if (order.status !== OrderStatus.DRAFTING) {
      throw new HttpException(
        `Order with id ${orderId} is not in the drafting status.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      {
        shippingAddress,
      },
      { new: true }
    );

    return updatedOrder.toObject();
  }

  async addItem(dto: AddItemBody, orderId: string, userId?: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order || (userId && order.customerId !== userId)) {
      throw new HttpException(
        `Order with id ${orderId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    if (order.status !== OrderStatus.DRAFTING) {
      throw new HttpException(
        `Order with id ${orderId} is not in the drafting status.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const { productId, quantity } = dto.item;

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new HttpException(
        `Product with id ${productId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    const isItemAlreadyInOrder = order.items.some(
      (item) => item.productId.toString() === productId
    );

    if (isItemAlreadyInOrder) {
      throw new HttpException(
        `Product with id ${productId} is already in the order. Please update the quantity instead.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const session = await this.productModel.startSession();

    let updatedOrder: Order;

    try {
      await session.withTransaction(async () => {
        await this.productModel.updateOne(
          { _id: productId },
          {
            $inc: {
              'stock.reservedQuantity': quantity,
            },
          },
          { session }
        );

        const updatedProduct = await this.productModel.findById(
          productId,
          undefined,
          {
            session,
          }
        );

        if (
          updatedProduct.stock.reservedQuantity >
          updatedProduct.stock.availableQuantity
        ) {
          await session.abortTransaction();
          throw new HttpException(
            `The requested quantity for product with id ${productId} is greater than the available quantity.`,
            HttpStatus.BAD_REQUEST
          );
        }

        order.items.push({
          ...dto.item,
          productId: new Types.ObjectId(productId),
        });

        await order.save({ session });

        updatedOrder = order.toObject();
      });
    } finally {
      await session.endSession();
    }

    return updatedOrder;
  }

  async removeItem(dto: RemoveItemBody, orderId: string, userId?: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order || (userId && order.customerId !== userId)) {
      throw new HttpException(
        `Order with id ${orderId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    if (order.status !== OrderStatus.DRAFTING) {
      throw new HttpException(
        `Order with id ${orderId} is not in the drafting status.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const { productId } = dto;

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new HttpException(
        `Product with id ${productId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    const item = order.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      throw new HttpException(
        `Product with id ${productId} is not in the order.`,
        HttpStatus.NOT_FOUND
      );
    }

    const session = await this.productModel.startSession();

    let updatedOrder: Order;

    try {
      await session.withTransaction(async () => {
        await this.productModel.updateOne(
          { _id: productId },
          {
            $inc: {
              'stock.reservedQuantity': item.quantity * -1,
            },
          },
          { session }
        );

        order.items = order.items.filter(
          (item) => item.productId.toString() !== productId
        );

        await order.save({ session });

        updatedOrder = order.toObject();
      });
    } finally {
      await session.endSession();
    }

    return updatedOrder;
  }

  async updateItem(dto: UpdateItemBody, orderId: string, userId?: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order || (userId && order.customerId !== userId)) {
      throw new HttpException(
        `Order with id ${orderId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    if (order.status !== OrderStatus.DRAFTING) {
      throw new HttpException(
        `Order with id ${orderId} is not in the drafting status.`,
        HttpStatus.BAD_REQUEST
      );
    }

    const { productId, quantity } = dto;

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new HttpException(
        `Product with id ${productId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    const item = order.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      throw new HttpException(
        `Product with id ${productId} is not in the order.`,
        HttpStatus.NOT_FOUND
      );
    }

    const session = await this.productModel.startSession();

    let updatedOrder: Order;

    try {
      await session.withTransaction(async () => {
        const difference = item.quantity - quantity;

        await this.productModel.updateOne(
          { _id: productId },
          {
            $inc: {
              'stock.reservedQuantity': difference * -1,
            },
          },
          { session }
        );

        const updatedProduct = await this.productModel.findById(
          productId,
          undefined,
          {
            session,
          }
        );

        if (
          updatedProduct.stock.reservedQuantity >
          updatedProduct.stock.availableQuantity
        ) {
          await session.abortTransaction();
          throw new HttpException(
            `The requested quantity for product with id ${productId} is greater than the available quantity.`,
            HttpStatus.BAD_REQUEST
          );
        }

        item.quantity = quantity;

        await order.save({ session });

        updatedOrder = order.toObject();
      });
    } finally {
      await session.endSession();
    }

    return updatedOrder;
  }

  async placeOrder(dto: PlaceOrderBody, orderId: string, userId?: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order || (userId && order.customerId !== userId)) {
      throw new HttpException(
        `Order with id ${orderId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    if (
      order.status !== OrderStatus.DRAFTING &&
      order.status !== OrderStatus.FAILED_PAYMENT
    ) {
      throw new HttpException(
        `Order with id ${orderId} is not in the drafting status.`,
        HttpStatus.BAD_REQUEST
      );
    }

    if (!order.shippingAddress) {
      throw new HttpException(
        `Order with id ${orderId} does not have a shipping address.`,
        HttpStatus.BAD_REQUEST
      );
    }

    if (!dto.overrideIdempotency) {
      const orderHash = await getOrderhHash(order, userId);
      const existingOrder = await this.orderModel.findOne({
        hash: orderHash,
        createdAt: {
          $gte: new Date(Date.now() - 1000 * 60 * 10),
        },
      });

      if (existingOrder) {
        throw new HttpException(
          'An order with the same items and shipping address has been placed within the last 10 minutes.',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const result = await this.outboxService.publish(
      async (session) => {
        const products = await Promise.all(
          order.items.map(async (item) => {
            const product = await this.productModel.findById(item.productId);

            if (!product) {
              throw new HttpException(
                `Product with id ${item.productId} not found.`,
                HttpStatus.NOT_FOUND
              );
            }

            await this.productModel.updateOne(
              { _id: item.productId },
              {
                $inc: {
                  'stock.availableQuantity': item.quantity * -1,
                  'stock.reservedQuantity': item.quantity * -1,
                },
              },
              { session }
            );

            return product.toObject();
          })
        );

        order.status = OrderStatus.PLACED;

        await order.save({ session });

        return {
          order: order.toObject(),
          products: products.reduce(
            (map, product) => ({
              ...map,
              [product.id]: product,
            }),
            {}
          ),
        };
      },
      {
        exchange: Exchange.OrderPlaced,
        routingKey: `${order.shippingAddress.country}.${order.shippingAddress.state}.${order.shippingAddress.city}.${order.shippingAddress.zip}.${order.type}`,
      }
    );

    return result.order;
  }

  async queryOrders(query: OrdersQuery, userId?: string) {
    const { pagination } = query;
    const { page, size } = defaultPagination(pagination);
    const filter: Pick<OrdersQuery, 'status' | 'type'> & {
      customerId?: string;
    } = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (userId) {
      filter.customerId = userId;
    }

    const sortField = query.sortByField || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const sort = { [sortField]: sortOrder };

    const orders = await this.orderModel
      .find(filter)
      .skip((page - 1) * size)
      .limit(size)
      .sort(sort);

    return orders.map((order) => order.toObject());
  }

  async fetchOrderById(orderId: string, userId?: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order || (userId && order.customerId !== userId)) {
      throw new HttpException(
        `Order with id ${orderId} not found.`,
        HttpStatus.NOT_FOUND
      );
    }

    return order.toObject();
  }
}
