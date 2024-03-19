import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { CustomerAggregationService } from '../services/customer-aggregation.service';
import { Authenticated, JWTPayload, Roles } from '@pos-app/auth';
import { CustomerAggregation } from '@pos-app/models';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(Authenticated)
@ApiTags(CustomerAggregation.name)
@Controller()
export class CustomerAggregationController {
  constructor(
    private readonly customerAggregationService: CustomerAggregationService
  ) {}

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer aggregation not found.',
  })
  @ApiOkResponse({ type: CustomerAggregation })
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

  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer aggregation not found.',
  })
  @ApiOkResponse({ type: CustomerAggregation })
  @Roles(['customer'])
  @Get('my-aggregation')
  async handleFetchMyAggregation(@JWTPayload() payload: JWTPayload) {
    return this.customerAggregationService.fetchCustomerAggregationById(
      payload.id
    );
  }
}
