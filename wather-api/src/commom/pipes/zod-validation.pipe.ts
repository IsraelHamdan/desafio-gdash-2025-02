import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class ZodValidationPipe<TSchema extends z.ZodType<any, any, any>> implements PipeTransform {
  constructor(private schema: TSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new BadRequestException(messages);
    }
    return result.data;
  }
}
