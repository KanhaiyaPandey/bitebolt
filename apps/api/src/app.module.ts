import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-ioredis-yet';

import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FoodsModule } from './modules/foods/foods.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { DbModule } from './db/db.module';
import configuration from './config/configuration';

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
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get('REDIS_HOST'),
          port: Number(config.get('REDIS_PORT')),
          password: config.get('REDIS_PASSWORD'),
          ttl: config.get('REDIS_TTL', 3600),
        }),
      }),
    }),

    // ── Feature Modules ─────────────────────────────────────────────────────
    DbModule,
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
})
export class AppModule {}
