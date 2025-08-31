import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { QuotationService } from "./quotation.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { UpdateQuotationDto } from "./dto/update-quotation.dto";
import { CentralizedAuthGuard } from "../auth/guards/centralized-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserContext } from "../auth/auth-client.service";

@ApiTags("quotations")
@Controller("quotation")
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  // Provider Actions
  @Post("provider/quotes")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Provider submits a quotation for a job" })
  @ApiResponse({ status: 201, description: "Quotation submitted successfully" })
  async create(
    @Body() createQuotationDto: CreateQuotationDto,
    @CurrentUser() user: UserContext
  ) {
    return this.quotationService.create(
      createQuotationDto,
      user.userId,
      user.email
    );
  }

  @Get("provider/quotes")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get provider's quotations" })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by quote status",
  })
  async findByProvider(
    @Query("status") status: string,
    @CurrentUser() user: UserContext
  ) {
    return this.quotationService.findByProvider(user.userId, status as any);
  }

  @Patch("provider/quotes/:id")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update provider's quotation" })
  async update(
    @Param("id") id: string,
    @Body() updateQuotationDto: UpdateQuotationDto,
    @CurrentUser() user: UserContext
  ) {
    return this.quotationService.update(id, updateQuotationDto, user.userId);
  }

  @Delete("provider/quotes/:id")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Cancel provider's quotation" })
  async cancel(@Param("id") id: string, @CurrentUser() user: UserContext) {
    return this.quotationService.cancelQuote(id, user.userId);
  }

  @Get("provider/metrics")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get provider quotation metrics" })
  async getProviderMetrics(@CurrentUser() user: UserContext) {
    return this.quotationService.getProviderMetrics(user.userId);
  }

  // Customer Actions
  @Get("customer/jobs/:jobId/quotes")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all quotations for a job (customer view)" })
  async findByJob(
    @Param("jobId") jobId: string,
    @CurrentUser() user: UserContext
  ) {
    return this.quotationService.findByJob(jobId, user.userId);
  }

  @Get("customer/quotes/:id")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get specific quotation details" })
  async findOne(@Param("id") id: string) {
    return this.quotationService.findOne(id);
  }

  @Post("customer/quotes/:id/accept")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Customer accepts a quotation" })
  async acceptQuote(
    @Param("id") id: string,
    @Body() body: { customer_notes?: string },
    @CurrentUser() user: UserContext
  ) {
    return this.quotationService.acceptQuote(
      id,
      user.userId,
      body.customer_notes
    );
  }

  @Post("customer/quotes/:id/reject")
  @UseGuards(CentralizedAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Customer rejects a quotation" })
  async rejectQuote(
    @Param("id") id: string,
    @Body() body: { customer_notes?: string },
    @CurrentUser() user: UserContext
  ) {
    return this.quotationService.rejectQuote(
      id,
      user.userId,
      body.customer_notes
    );
  }
}
