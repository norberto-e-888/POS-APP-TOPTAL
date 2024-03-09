import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, Product } from '../models';
import { CreateOrderBody } from '../validators';
import { OutboxService } from '@pos-app/outbox';
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
        routingKey: `${dto.shippingAddress.country}.${dto.shippingAddress.state}.${dto.shippingAddress.city}.${dto.shippingAddress.zip}`,
      },
      {
        transformPayload: async (order) => {
          const items = await this.productModel.find({
            _id: {
              $in: order.items.map((item) => item.productId),
            },
          });

          const itemsObjs = items.map((item) => item.toObject());

          return {
            ...order,
            items: itemsObjs,
          };
        },
      }
    );
  }
}
