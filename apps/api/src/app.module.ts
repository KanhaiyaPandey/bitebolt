import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-ioredis-yet';

import { AppController } from './app.controller';
import configuration from './config/configuration';
import { DbModule } from './db/db.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FoodsModule } from './modules/foods/foods.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    // ── Config ─────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      // `nest` runs from `apps/api`, while `.env` typically lives at repo root.
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),

    // ── Rate Limiting ───────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60) * 1000,
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ── Redis Cache ─────────────────────────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let storeOptions: any;
        if (redisUrl) {
          const url = new URL(redisUrl);
          storeOptions = {
            host: url.hostname,
            port: Number(url.port) || 6379,
            password: url.password ? decodeURIComponent(url.password) : undefined,
            tls: url.protocol === 'rediss:' ? {} : undefined,
          };
        } else {
          storeOptions = {
            host: config.get('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
            password: config.get('REDIS_PASSWORD'),
          };
        }
        return {
          store: await redisStore(storeOptions),
          ttl: config.get<number>('REDIS_TTL', 3600),
        };
      },
    }),

    // ── Feature Modules ─────────────────────────────────────────────────────
    DbModule,
    SettingsModule,
    AnalyticsModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    FoodsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    WalletModule,
    NotificationsModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
