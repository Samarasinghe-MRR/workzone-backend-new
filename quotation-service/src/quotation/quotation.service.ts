import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EventPublisherService } from "../events/event-publisher.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { UpdateQuotationDto } from "./dto/update-quotation.dto";
import { QuoteStatus } from "../../generated/prisma";

@Injectable()
export class QuotationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService
  ) {}

  // Provider submits a quotation for a job
  async create(
    createQuotationDto: CreateQuotationDto,
    providerId: string,
    providerEmail: string
  ) {
    // Check if provider already has a quote for this job
    const existingQuote = await this.prisma.quotation.findFirst({
      where: {
        job_id: createQuotationDto.job_id,
        provider_id: providerId,
        status: { not: QuoteStatus.CANCELLED },
      },
    });

    if (existingQuote) {
      throw new BadRequestException(
        "You have already submitted a quote for this job"
      );
    }

    const quotationData = {
      ...createQuotationDto,
      provider_id: providerId,
      provider_email: providerEmail,
      proposed_start: createQuotationDto.proposed_start
        ? new Date(createQuotationDto.proposed_start)
        : null,
      valid_until: createQuotationDto.valid_until
        ? new Date(createQuotationDto.valid_until)
        : null,
    };

    const quotation = await this.prisma.quotation.create({
      data: quotationData,
    });

    // Publish quote.submitted event
    await this.eventPublisher.publishQuoteSubmitted({
      quoteId: quotation.id,
      jobId: quotation.job_id,
      providerId: quotation.provider_id,
      price: quotation.price,
      submittedAt: quotation.created_at,
    });

    // Update provider metrics
    await this.updateProviderMetrics(providerId, "quote_submitted");

    return quotation;
  }

  // Get all quotations for a specific job (for customer to review)
  async findByJob(jobId: string, customerId?: string) {
    const quotations = await this.prisma.quotation.findMany({
      where: {
        job_id: jobId,
        status: { in: [QuoteStatus.PENDING, QuoteStatus.ACCEPTED] },
      },
      orderBy: [
        { status: "asc" }, // ACCEPTED first
        { price: "asc" }, // Then by price
        { created_at: "desc" },
      ],
    });

    return {
      jobId,
      quotations,
      summary: {
        total: quotations.length,
        pending: quotations.filter((q) => q.status === QuoteStatus.PENDING)
          .length,
        accepted: quotations.filter((q) => q.status === QuoteStatus.ACCEPTED)
          .length,
        averagePrice:
          quotations.length > 0
            ? quotations.reduce((sum, q) => sum + q.price, 0) /
              quotations.length
            : 0,
        priceRange: {
          min: Math.min(...quotations.map((q) => q.price)) || 0,
          max: Math.max(...quotations.map((q) => q.price)) || 0,
        },
      },
    };
  }

  // Get quotations by provider (provider's submitted quotes)
  async findByProvider(providerId: string, status?: QuoteStatus) {
    const where: any = { provider_id: providerId };
    if (status) where.status = status;

    return this.prisma.quotation.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
  }

  // Get specific quotation by ID
  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    return quotation;
  }

  // Provider updates their quotation (only if still pending)
  async update(
    id: string,
    updateQuotationDto: UpdateQuotationDto,
    providerId: string
  ) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    if (quotation.provider_id !== providerId) {
      throw new ForbiddenException("You can only update your own quotations");
    }

    if (quotation.status !== QuoteStatus.PENDING) {
      throw new ForbiddenException("Only pending quotations can be updated");
    }

    const updateData = {
      ...updateQuotationDto,
      proposed_start: updateQuotationDto.proposed_start
        ? new Date(updateQuotationDto.proposed_start)
        : undefined,
      valid_until: updateQuotationDto.valid_until
        ? new Date(updateQuotationDto.valid_until)
        : undefined,
    };

    return this.prisma.quotation.update({
      where: { id },
      data: updateData,
    });
  }

  // Customer accepts a quotation (KEY BUSINESS LOGIC)
  async acceptQuote(id: string, customerId: string, customerNotes?: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    if (quotation.status !== QuoteStatus.PENDING) {
      throw new BadRequestException("Only pending quotations can be accepted");
    }

    // Check if quote has expired
    if (quotation.valid_until && quotation.valid_until < new Date()) {
      throw new BadRequestException("This quotation has expired");
    }

    // Start transaction to ensure consistency
    const result = await this.prisma.$transaction(async (prisma) => {
      // Accept this quotation
      const acceptedQuote = await prisma.quotation.update({
        where: { id },
        data: {
          status: QuoteStatus.ACCEPTED,
          accepted_at: new Date(),
          customer_notes: customerNotes,
        },
      });

      // Reject all other pending quotations for the same job
      await prisma.quotation.updateMany({
        where: {
          job_id: quotation.job_id,
          id: { not: id },
          status: QuoteStatus.PENDING,
        },
        data: {
          status: QuoteStatus.REJECTED,
          rejected_at: new Date(),
        },
      });

      return acceptedQuote;
    });

    // Publish quote.accepted event (this triggers job assignment in Job Service)
    await this.eventPublisher.publishQuoteAccepted({
      quoteId: result.id,
      jobId: result.job_id,
      providerId: result.provider_id,
      customerId: customerId,
      price: result.price,
      acceptedAt: result.accepted_at!,
    });

    // Update provider metrics
    await this.updateProviderMetrics(result.provider_id, "quote_accepted");

    return result;
  }

  // Customer rejects a quotation
  async rejectQuote(id: string, customerId: string, customerNotes?: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    if (quotation.status !== QuoteStatus.PENDING) {
      throw new BadRequestException("Only pending quotations can be rejected");
    }

    const rejectedQuote = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: QuoteStatus.REJECTED,
        rejected_at: new Date(),
        customer_notes: customerNotes,
      },
    });

    // Publish quote.rejected event
    await this.eventPublisher.publishQuoteRejected({
      quoteId: rejectedQuote.id,
      jobId: rejectedQuote.job_id,
      providerId: rejectedQuote.provider_id,
      customerId: customerId,
      rejectedAt: rejectedQuote.rejected_at!,
    });

    // Update provider metrics
    await this.updateProviderMetrics(
      rejectedQuote.provider_id,
      "quote_rejected"
    );

    return rejectedQuote;
  }

  // Provider cancels their quotation
  async cancelQuote(id: string, providerId: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    if (quotation.provider_id !== providerId) {
      throw new ForbiddenException("You can only cancel your own quotations");
    }

    if (quotation.status !== QuoteStatus.PENDING) {
      throw new ForbiddenException("Only pending quotations can be cancelled");
    }

    const cancelledQuote = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: QuoteStatus.CANCELLED,
        cancelled_at: new Date(),
      },
    });

    // Publish quote.cancelled event
    await this.eventPublisher.publishQuoteCancelled({
      quoteId: cancelledQuote.id,
      jobId: cancelledQuote.job_id,
      providerId: cancelledQuote.provider_id,
      cancelledAt: cancelledQuote.cancelled_at!,
    });

    return cancelledQuote;
  }

  // Delete quotation (admin only or in special cases)
  async remove(id: string, providerId: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    if (quotation.provider_id !== providerId) {
      throw new ForbiddenException("You can only delete your own quotations");
    }

    if (quotation.status === QuoteStatus.ACCEPTED) {
      throw new ForbiddenException("Cannot delete accepted quotations");
    }

    await this.prisma.quotation.delete({
      where: { id },
    });

    return { message: "Quotation deleted successfully" };
  }

  // Analytics: Get provider quotation metrics
  async getProviderMetrics(providerId: string) {
    const metrics = await this.prisma.quotationMetrics.findFirst({
      where: { provider_id: providerId },
    });

    if (!metrics) {
      return {
        provider_id: providerId,
        total_quotes: 0,
        accepted_quotes: 0,
        rejected_quotes: 0,
        success_rate: 0,
        average_price: 0,
      };
    }

    return metrics;
  }

  // Helper: Update provider metrics
  private async updateProviderMetrics(
    providerId: string,
    action: "quote_submitted" | "quote_accepted" | "quote_rejected"
  ) {
    const existing = await this.prisma.quotationMetrics.findFirst({
      where: { provider_id: providerId },
    });

    if (!existing) {
      // Create new metrics record
      await this.prisma.quotationMetrics.create({
        data: {
          provider_id: providerId,
          total_quotes: action === "quote_submitted" ? 1 : 0,
          accepted_quotes: action === "quote_accepted" ? 1 : 0,
          rejected_quotes: action === "quote_rejected" ? 1 : 0,
        },
      });
    } else {
      // Update existing metrics
      const updateData: any = {};

      if (action === "quote_submitted") {
        updateData.total_quotes = { increment: 1 };
      } else if (action === "quote_accepted") {
        updateData.accepted_quotes = { increment: 1 };
      } else if (action === "quote_rejected") {
        updateData.rejected_quotes = { increment: 1 };
      }

      await this.prisma.quotationMetrics.update({
        where: { id: existing.id },
        data: updateData,
      });

      // Recalculate success rate
      const updated = await this.prisma.quotationMetrics.findFirst({
        where: { provider_id: providerId },
      });

      if (updated && updated.total_quotes > 0) {
        const successRate =
          (updated.accepted_quotes / updated.total_quotes) * 100;
        await this.prisma.quotationMetrics.update({
          where: { id: updated.id },
          data: { success_rate: successRate },
        });
      }
    }
  }

  // Clean up expired quotations (scheduled task)
  async cleanupExpiredQuotes() {
    const now = new Date();
    const expiredQuotes = await this.prisma.quotation.updateMany({
      where: {
        status: QuoteStatus.PENDING,
        valid_until: { lt: now },
      },
      data: {
        status: QuoteStatus.EXPIRED,
      },
    });

    return { expiredCount: expiredQuotes.count };
  }

  // Cancel all quotations for a specific job (when job is cancelled)
  async cancelQuotationsByJobId(jobId: string) {
    // Get all pending quotations for this job
    const pendingQuotations = await this.prisma.quotation.findMany({
      where: {
        job_id: jobId,
        status: QuoteStatus.PENDING,
      },
    });

    if (pendingQuotations.length === 0) {
      return { cancelledCount: 0 };
    }

    // Cancel all pending quotations
    const updatedQuotations = await this.prisma.quotation.updateMany({
      where: {
        job_id: jobId,
        status: QuoteStatus.PENDING,
      },
      data: {
        status: QuoteStatus.CANCELLED,
        cancelled_at: new Date(),
      },
    });

    // Publish events for each cancelled quotation
    for (const quotation of pendingQuotations) {
      await this.eventPublisher.publishQuoteCancelled({
        quoteId: quotation.id,
        jobId: quotation.job_id,
        providerId: quotation.provider_id,
        cancelledAt: new Date(),
      });
    }

    return { cancelledCount: updatedQuotations.count };
  }
}
