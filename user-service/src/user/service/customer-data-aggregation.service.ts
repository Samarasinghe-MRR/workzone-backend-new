/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface JobData {
  id: string;
  title: string;
  description: string;
  status: string;
  price?: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
  providerId?: string;
}

export interface QuotationData {
  id: string;
  jobId: string;
  providerId: string;
  price: number;
  status: string;
  message?: string;
  createdAt: string;
  estimatedTime?: string;
}

export interface CustomerAggregatedData {
  user: any;
  jobs: {
    total: number;
    posted: JobData[];
    assigned: JobData[];
    completed: JobData[];
  };
  quotations: {
    total: number;
    received: QuotationData[];
    accepted: QuotationData[];
    pending: QuotationData[];
  };
  statistics: {
    totalSpent: number;
    averageJobPrice: number;
    completionRate: number;
    responseTime: string;
  };
}

@Injectable()
export class CustomerDataAggregationService {
  private readonly jobServiceUrl =
    process.env.JOB_SERVICE_URL || 'http://localhost:3002';
  private readonly quotationServiceUrl =
    process.env.QUOTATION_SERVICE_URL || 'http://localhost:3004';

  async getCustomerAggregatedData(
    userId: string,
    userToken?: string,
  ): Promise<CustomerAggregatedData> {
    try {
      // Headers for service-to-service calls
      const headers = userToken
        ? {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          }
        : {
            'Content-Type': 'application/json',
          };

      // Fetch data from all services in parallel
      const [jobsResponse, quotationsResponse] = await Promise.allSettled([
        this.fetchCustomerJobs(userId, headers),
        this.fetchCustomerQuotations(userId, headers),
      ]);

      // Extract data or set defaults
      const jobs =
        jobsResponse.status === 'fulfilled' ? jobsResponse.value : [];
      const quotations =
        quotationsResponse.status === 'fulfilled'
          ? quotationsResponse.value
          : [];

      // Categorize jobs by status
      const postedJobs = jobs.filter(
        (job: JobData) => job.status === 'OPEN' || job.status === 'PENDING',
      );
      const assignedJobs = jobs.filter(
        (job: JobData) =>
          job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS',
      );
      const completedJobs = jobs.filter(
        (job: JobData) => job.status === 'COMPLETED',
      );

      // Categorize quotations by status
      const receivedQuotations = quotations;
      const acceptedQuotations = quotations.filter(
        (q: QuotationData) => q.status === 'ACCEPTED',
      );
      const pendingQuotations = quotations.filter(
        (q: QuotationData) => q.status === 'PENDING',
      );

      // Calculate statistics
      const totalSpent = completedJobs.reduce(
        (sum: number, job: JobData) => sum + (job.price || 0),
        0,
      );
      const averageJobPrice =
        jobs.length > 0
          ? jobs.reduce(
              (sum: number, job: JobData) => sum + (job.price || 0),
              0,
            ) / jobs.length
          : 0;
      const completionRate =
        jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0;

      return {
        user: null, // Will be populated by the calling service
        jobs: {
          total: jobs.length,
          posted: postedJobs,
          assigned: assignedJobs,
          completed: completedJobs,
        },
        quotations: {
          total: quotations.length,
          received: receivedQuotations,
          accepted: acceptedQuotations,
          pending: pendingQuotations,
        },
        statistics: {
          totalSpent,
          averageJobPrice,
          completionRate: Math.round(completionRate * 100) / 100,
          responseTime: this.calculateAverageResponseTime(quotations),
        },
      };
    } catch (error) {
      console.error('Error aggregating customer data:', error);
      throw new HttpException(
        'Failed to aggregate customer data from microservices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async fetchCustomerJobs(
    userId: string,
    headers: any,
  ): Promise<JobData[]> {
    try {
      const response = await axios.get(
        `${this.jobServiceUrl}/jobs/customer/${userId}`,
        { headers, timeout: 5000 },
      );
      return response.data.jobs || response.data || [];
    } catch (error: any) {
      console.warn(
        `Failed to fetch jobs for customer ${userId}:`,
        error.message,
      );
      return [];
    }
  }

  private async fetchCustomerQuotations(
    userId: string,
    headers: any,
  ): Promise<QuotationData[]> {
    try {
      // First, get all jobs for this customer to find quotations
      const jobs = await this.fetchCustomerJobs(userId, headers);
      const allQuotations: QuotationData[] = [];

      // For each job, fetch its quotations
      for (const job of jobs) {
        try {
          const response = await axios.get(
            `${this.quotationServiceUrl}/quotation/customer/jobs/${job.id}/quotes`,
            { headers, timeout: 5000 },
          );
          const jobQuotations = response.data.quotations || response.data || [];
          allQuotations.push(...jobQuotations);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          console.warn(`Failed to fetch quotations for job ${job.id}`);
        }
      }

      return allQuotations;
    } catch (error: any) {
      console.warn(
        `Failed to fetch quotations for customer ${userId}:`,
        error.message,
      );
      return [];
    }
  }

  private calculateAverageResponseTime(quotations: QuotationData[]): string {
    if (quotations.length === 0) return 'N/A';

    // This is a simplified calculation
    // In practice, you'd calculate time between job posting and first quotation
    const averageHours = Math.floor(Math.random() * 24) + 1; // Placeholder logic
    return `${averageHours} hours`;
  }

  // Method to get provider aggregated data
  async getProviderAggregatedData(userId: string, userToken?: string) {
    try {
      const headers = userToken
        ? {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          }
        : {
            'Content-Type': 'application/json',
          };

      // Fetch provider-specific data
      const [assignedJobsResponse, quotationsResponse, metricsResponse] =
        await Promise.allSettled([
          this.fetchProviderJobs(userId, headers),
          this.fetchProviderQuotations(userId, headers),
          this.fetchProviderMetrics(userId, headers),
        ]);

      const assignedJobs =
        assignedJobsResponse.status === 'fulfilled'
          ? assignedJobsResponse.value
          : [];
      const quotations =
        quotationsResponse.status === 'fulfilled'
          ? quotationsResponse.value
          : [];
      const metrics =
        metricsResponse.status === 'fulfilled' ? metricsResponse.value : {};

      return {
        user: null, // Will be populated by calling service
        assignedJobs: {
          total: assignedJobs.length,
          active: assignedJobs.filter(
            (job: JobData) =>
              job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS',
          ),
          completed: assignedJobs.filter(
            (job: JobData) => job.status === 'COMPLETED',
          ),
        },
        quotations: {
          total: quotations.length,
          submitted: quotations,
          accepted: quotations.filter(
            (q: QuotationData) => q.status === 'ACCEPTED',
          ),
          pending: quotations.filter(
            (q: QuotationData) => q.status === 'PENDING',
          ),
        },
        metrics: metrics,
      };
    } catch (error) {
      console.error('Error aggregating provider data:', error);
      throw new HttpException(
        'Failed to aggregate provider data from microservices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async fetchProviderJobs(
    userId: string,
    headers: any,
  ): Promise<JobData[]> {
    try {
      const response = await axios.get(
        `${this.jobServiceUrl}/jobs/provider/${userId}`,
        { headers, timeout: 5000 },
      );
      return response.data.jobs || response.data || [];
    } catch (error: any) {
      console.warn(
        `Failed to fetch jobs for provider ${userId}:`,
        error.message,
      );
      return [];
    }
  }

  private async fetchProviderQuotations(
    userId: string,
    headers: any,
  ): Promise<QuotationData[]> {
    try {
      const response = await axios.get(
        `${this.quotationServiceUrl}/quotation/provider/quotes`,
        { headers, timeout: 5000 },
      );
      return response.data || [];
    } catch (error: any) {
      console.warn(
        `Failed to fetch quotations for provider ${userId}:`,
        error.message,
      );
      return [];
    }
  }

  private async fetchProviderMetrics(userId: string, headers: any) {
    try {
      const response = await axios.get(
        `${this.quotationServiceUrl}/quotation/provider/metrics`,
        { headers, timeout: 5000 },
      );
      return response.data || {};
    } catch (error: any) {
      console.warn(
        `Failed to fetch metrics for provider ${userId}:`,
        error.message,
      );
      return {};
    }
  }
}
