import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { Public } from './common/decorators';
import { DbService } from './db/db.service';

@Controller()
export class AppController {
  constructor(private readonly db: DbService) {}

  @Public()
  @Get('health')
  async health() {
    try {
      await this.db.db.execute(sql`select 1`);
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch {
      throw new HttpException(
        { status: 'error', message: 'Database unreachable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
