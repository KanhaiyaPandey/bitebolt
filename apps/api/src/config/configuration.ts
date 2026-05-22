export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
    ttl: parseInt(process.env.REDIS_TTL ?? '3600', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'changeme',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'changeme-refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES ?? '10', 10),
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    region: process.env.AWS_REGION ?? 'ap-south-1',
    s3Bucket: process.env.AWS_S3_BUCKET ?? '',
    cloudfrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN ?? '',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
});
