import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CustomerAggregationService } from '../services/customer-aggregation.service';
import { Authenticated, JWTPayload, Roles } from '@pos-app/auth';
import { CustomerAggregation } from '@pos-app/models';
import { ApiTags } from '@nestjs/swagger';

@UseGuards(Authenticated)
@ApiTags(CustomerAggregation.name)
@Controller()
export class CustomerAggregationController {
  constructor(
    private readonly customerAggregationService: CustomerAggregationService
  ) {}

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

  @Roles(['customer'])
  @Get('my-aggregation')
  async handleFetchMyAggregation(@JWTPayload() payload: JWTPayload) {
    return this.customerAggregationService.fetchCustomerAggregationById(
      payload.id
    );
  }
}
