import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.model';
import { Product, ProductSchema } from './product.model';
import {
  CustomerAggregation,
  CustomerAggregationSchema,
} from './customer-aggregation.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: CustomerAggregation.name,
        schema: CustomerAggregationSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class OrderModelsModule {}
