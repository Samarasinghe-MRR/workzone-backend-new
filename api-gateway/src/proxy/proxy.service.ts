import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";
import { Observable, catchError, map, timeout } from "rxjs";

export interface ServiceConfig {
  name: string;
  url: string;
  timeout?: number;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly services: Record<string, ServiceConfig>;

  constructor(private readonly httpService: HttpService) {
    // Configure microservices
    this.services = {
      auth: {
        name: "Auth Service",
        url: process.env.AUTH_SERVICE_URL || "http://localhost:3000",
        timeout: 10000,
      },
      users: {
        name: "User Service",
        url: process.env.USER_SERVICE_URL || "http://localhost:3001",
        timeout: 10000,
      },
      jobs: {
        name: "Job Service",
        url: process.env.JOB_SERVICE_URL || "http://localhost:3002",
        timeout: 10000,
      },
      quotations: {
        name: "Quotation Service",
        url: process.env.QUOTATION_SERVICE_URL || "http://localhost:3004",
        timeout: 10000,
      },
      categories: {
        name: "Category Service",
        url: process.env.CATEGORY_SERVICE_URL || "http://localhost:3005",
        timeout: 10000,
      },
    };
  }

  /**
   * Forward request to the appropriate microservice
   */
  forwardRequest(
    serviceName: string,
    path: string,
    method: string,
    headers: any,
    body?: any,
    query?: any
  ): Observable<any> {
    const service = this.services[serviceName];

    if (!service) {
      throw new HttpException(
        `Service '${serviceName}' not found`,
        HttpStatus.NOT_FOUND
      );
    }

    const url = `${service.url}${path}`;
    const requestConfig = {
      headers: this.sanitizeHeaders(headers),
      timeout: service.timeout,
      params: query,
    };

    this.logger.debug(`Forwarding ${method} ${url}`);

    let request: Observable<AxiosResponse>;

    switch (method.toUpperCase()) {
      case "GET":
        request = this.httpService.get(url, requestConfig);
        break;
      case "POST":
        request = this.httpService.post(url, body, requestConfig);
        break;
      case "PUT":
        request = this.httpService.put(url, body, requestConfig);
        break;
      case "PATCH":
        request = this.httpService.patch(url, body, requestConfig);
        break;
      case "DELETE":
        request = this.httpService.delete(url, requestConfig);
        break;
      default:
        throw new HttpException(
          `Method '${method}' not supported`,
          HttpStatus.METHOD_NOT_ALLOWED
        );
    }

    return request.pipe(
      timeout(service.timeout),
      map((response) => response.data),
      catchError((error) => {
        this.logger.error(
          `Error forwarding to ${service.name}: ${error.message}`,
          error.stack
        );

        if (error.response) {
          // Forward the error response from the microservice
          throw new HttpException(
            error.response.data || error.message,
            error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
          );
        }

        // Network or timeout error
        throw new HttpException(
          `${service.name} is unavailable`,
          HttpStatus.SERVICE_UNAVAILABLE
        );
      })
    );
  }

  /**
   * Get service health status
   */
  async getServiceHealth(serviceName: string): Promise<any> {
    const service = this.services[serviceName];

    if (!service) {
      return { status: "unknown", message: "Service not configured" };
    }

    try {
      const response = await this.httpService
        .get(`${service.url}/health`, { timeout: 5000 })
        .toPromise();

      return {
        status: "healthy",
        service: service.name,
        url: service.url,
        response: response?.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        service: service.name,
        url: service.url,
        error: error.message,
      };
    }
  }

  /**
   * Get all services health status
   */
  async getAllServicesHealth(): Promise<any> {
    const healthChecks = await Promise.allSettled(
      Object.keys(this.services).map((serviceName) =>
        this.getServiceHealth(serviceName)
      )
    );

    const results = Object.keys(this.services).map((serviceName, index) => {
      const result = healthChecks[index];
      return {
        service: serviceName,
        ...(result.status === "fulfilled"
          ? result.value
          : { status: "error", error: result.reason }),
      };
    });

    const overallStatus = results.every((r) => r.status === "healthy")
      ? "healthy"
      : "unhealthy";

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: results,
    };
  }

  /**
   * Sanitize headers to forward to microservices
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Remove headers that shouldn't be forwarded
    delete sanitized["host"];
    delete sanitized["connection"];
    delete sanitized["content-length"];

    return sanitized;
  }

  /**
   * Get list of configured services
   */
  getServices(): Record<string, ServiceConfig> {
    return this.services;
  }
}
