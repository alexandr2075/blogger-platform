import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ConditionalThrottlerGuard extends ThrottlerGuard {
  constructor(
    private configService: ConfigService,
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if throttling is enabled via environment variable
    const isThrottlingEnabled = this.configService.get<string>('ENABLE_THROTTLING') === 'true';
    
    // If throttling is disabled, always allow the request
    if (!isThrottlingEnabled) {
      return true;
    }

    // If throttling is enabled, use the default ThrottlerGuard logic
    return super.canActivate(context);
  }
}
