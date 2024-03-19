import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerAggregation } from '@pos-app/models';

@Injectable()
export class CustomerAggregationService {
  constructor(
    @InjectModel(CustomerAggregation.name)
    private readonly customerAggregationModel: Model<CustomerAggregation>
  ) {}

  async fetchCustomerAggregationById(customerId: string) {
    const document = await this.customerAggregationModel.findOne({
      customerId,
    });

    if (!document) {
      throw new HttpException(
        'Customer aggregation not found.',
        HttpStatus.NOT_FOUND
      );
    }

    const obj = document.toObject();

    return {
      ...obj,
      productFrequency: Object.fromEntries(obj.productFrequency.entries()),
    };
  }
}
