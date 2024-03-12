import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CustomerAggregationService } from '../services/customer-aggregation.service';
import { Authenticated, JWTPayload, Roles } from '@pos-app/auth';

@Controller()
export class CustomerAggregationController {
  constructor(
    private readonly customerAggregationService: CustomerAggregationService
  ) {}

  @UseGuards(Authenticated)
  @Roles(['admin'])
  @Get('customer-aggregation/:customerId')
  async handleFetchCustomerAggregationById(
    @Param('customerId')
    customerId: string
  ) {
    return this.customerAggregationService.fetchCustomerAggregationById(
      customerId
    );
  }

  @UseGuards(Authenticated)
  @Roles(['customer'])
  @Get('my-aggregation')
  async handleFetchMyAggregation(@JWTPayload() payload: JWTPayload) {
    return this.customerAggregationService.fetchCustomerAggregationById(
      payload.id
    );
  }
}
