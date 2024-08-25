import { HttpStatus } from '@nestjs/common';

interface HttpResponseProps {
  message?: string;
  statusCode?: HttpStatus;
  docs?: Record<string, unknown>;
  data?: Record<string, unknown> | unknown[] | string | null | undefined;
  others?: Record<string, unknown> | unknown[] | string | number | undefined;
  stack?: Record<string, unknown> | string;
}

export class HttpResponse {
  public readonly success: boolean;
  public readonly message: string | undefined;
  public readonly docs: Record<string, unknown> | undefined;
  public readonly data:
    | Record<string, unknown>
    | unknown[]
    | string
    | undefined
    | null;
  public readonly others:
    | Record<string, unknown>
    | unknown[]
    | string
    | number
    | undefined;
  public readonly stack: Record<string, unknown> | string | unknown;

  constructor({
    statusCode,
    message,
    data,
    docs,
    others,
    stack,
  }: HttpResponseProps) {
    statusCode = statusCode ?? 200;

    if (statusCode >= 300) {
      this.success = false;
    } else {
      this.success = true;
    }

    this.message = message;
    this.docs = docs;
    this.data = data;
    this.others = others;
    this.stack = stack;
  }
}
