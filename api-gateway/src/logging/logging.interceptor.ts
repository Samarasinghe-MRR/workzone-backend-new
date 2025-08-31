import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url, headers } = req;
    const userAgent = headers["user-agent"] || "";
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = res;
        const contentLength = res.get("content-length");
        const responseTime = Date.now() - start;

        this.logger.log(
          `${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${responseTime}ms`
        );
      })
    );
  }
}
