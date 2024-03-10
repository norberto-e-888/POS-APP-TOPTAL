import { Order, OrderStatus, Product } from '@pos-app/models';
import { OutboxService } from '@pos-app/outbox';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  AddItemBody,
  AddShippingAddressBody,
  CreateOrderBody,
} from '../validators';
import { Exchange } from '../app/amqp';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    private readonly outboxService: OutboxService
  ) {}

  async createOrder(dto: CreateOrderBody, userId: string) {
    const { items } = dto;

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
      }
    );
  }

  async addShippingAddress(
    { shippingAddress }: AddShippingAddressBody,
    userId: string,
    orderId: string
  ) {
    const order = await this.orderModel.findById(orderId);

    if (!order || order.customerId !== userId) {
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

  async addItem(dto: AddItemBody, userId: string, orderId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order || order.customerId !== userId) {
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
}

/* if (!dto.overrideIdempotency) {
  const orderHash = await getOrderhHash(dto as unknown as Order, userId);
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


        routingKey: `${dto.shippingAddress.country}.${dto.shippingAddress.state}.${dto.shippingAddress.city}.${dto.shippingAddress.zip}`,
 */
