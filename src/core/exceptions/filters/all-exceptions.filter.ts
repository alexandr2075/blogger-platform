import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainExceptionCode } from '../domain-exception-codes';
import { ErrorResponseBody } from './error-response-body.type';

//https://docs.nestjs.com/exception-filters#exception-filters-1
//Все ошибки
@Catch(HttpException)
export class AllHttpExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    //ctx нужен, чтобы получить request и response (express). Это из документации, делаем по аналогии
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    //Если сработал этот фильтр, то пользователю улетит 500я ошибка
    const message = exception.message || 'Unknown exception occurred.';
    // const status = HttpStatus.INTERNAL_SERVER_ERROR;

    const status = exception.getStatus();
    const responseBody = this.buildResponseBody(exception, request.url, message);

    response.status(status).json(responseBody);
  }

  private buildResponseBody(
    exception: HttpException,
    requestUrl: string,
    message: string,
  ) {
    //TODO: Replace with getter from configService. will be in the following lessons
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return {
        timestamp: new Date().toISOString(),
        path: null,
        message: 'Some error occurred',
        extensions: [],
        code: DomainExceptionCode.InternalServerError,
      };
    }

    // Check if the exception already has the proper errorsMessages format
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null && 'errorsMessages' in response) {
      return response;
    }

    return {
      errorsMessages: [{ message, field: message.split(' ')[0] }],
    };
    // return {
    //   timestamp: new Date().toISOString(),
    //   path: requestUrl,
    //   message,
    //   extensions: [],
    //   code: DomainExceptionCode.InternalServerError,
    // };
  }
}
