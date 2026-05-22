CREATE TYPE "public"."notification_type" AS ENUM('ORDER_UPDATE', 'PAYMENT', 'PROMOTIONAL', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('UPI', 'CARD', 'NET_BANKING', 'WALLET', 'COD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CUSTOMER', 'ADMIN', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "public"."wallet_transaction_reason" AS ENUM('ORDER_PAYMENT', 'ORDER_REFUND', 'TOP_UP', 'CASHBACK');--> statement-breakpoint
CREATE TYPE "public"."wallet_transaction_type" AS ENUM('CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"label" text DEFAULT 'Home' NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"food_item_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"special_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cart_user_food_unique" UNIQUE("user_id","food_item_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "food_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"discounted_price" numeric(10, 2),
	"image_url" text,
	"images" text[] DEFAULT '{}'::text[],
	"is_veg" boolean DEFAULT true NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"preparation_time" integer DEFAULT 30 NOT NULL,
	"rating" double precision DEFAULT 0 NOT NULL,
	"total_ratings" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}'::text[],
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"food_item_id" text NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"special_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"status" "order_status" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"user_id" text NOT NULL,
	"address_id" text NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '40' NOT NULL,
	"taxes" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"special_instructions" text,
	"estimated_delivery_time" integer,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"otp" text NOT NULL,
	"user_id" text,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"wallet_amount_used" numeric(10, 2) DEFAULT '0' NOT NULL,
	"failure_reason" text,
	"refund_id" text,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"email" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"fcm_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" text NOT NULL,
	"order_id" text,
	"type" "wallet_transaction_type" NOT NULL,
	"reason" "wallet_transaction_reason" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"balance_after" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_food_item_id_food_items_id_fk" FOREIGN KEY ("food_item_id") REFERENCES "public"."food_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_user_id_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_user_id_idx" ON "cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "category_is_active_idx" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "food_item_category_id_idx" ON "food_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "food_item_is_available_idx" ON "food_items" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "food_item_is_veg_idx" ON "food_items" USING btree ("is_veg");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_verifications" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "otp_expires_at_idx" ON "otp_verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wallet_tx_wallet_id_idx" ON "wallet_transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "wallet_tx_order_id_idx" ON "wallet_transactions" USING btree ("order_id");