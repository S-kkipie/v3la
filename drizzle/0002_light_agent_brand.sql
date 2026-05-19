CREATE TABLE "embedded_wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"public_key" text NOT NULL,
	"chain" text DEFAULT 'solana' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "embedded_wallet_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
CREATE TABLE "embedded_wallet_access" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"user_id" text NOT NULL,
	"passkey_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"kdf_version" text NOT NULL,
	"cipher_version" text NOT NULL,
	"wrapped_seed" text NOT NULL,
	"iv" text NOT NULL,
	"aad" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "embedded_wallet_access_wallet_passkey_unique" UNIQUE("wallet_id","passkey_id"),
	CONSTRAINT "embedded_wallet_access_wallet_credential_unique" UNIQUE("wallet_id","credential_id")
);
--> statement-breakpoint
CREATE TABLE "embedded_wallet_operation" (
	"id" text PRIMARY KEY NOT NULL,
	"wallet_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"origin" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "embedded_wallet" ADD CONSTRAINT "embedded_wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedded_wallet_access" ADD CONSTRAINT "embedded_wallet_access_wallet_id_embedded_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."embedded_wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedded_wallet_access" ADD CONSTRAINT "embedded_wallet_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedded_wallet_access" ADD CONSTRAINT "embedded_wallet_access_passkey_id_passkey_id_fk" FOREIGN KEY ("passkey_id") REFERENCES "public"."passkey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedded_wallet_operation" ADD CONSTRAINT "embedded_wallet_operation_wallet_id_embedded_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."embedded_wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedded_wallet_operation" ADD CONSTRAINT "embedded_wallet_operation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embedded_wallet_user_id_idx" ON "embedded_wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "embedded_wallet_public_key_idx" ON "embedded_wallet" USING btree ("public_key");--> statement-breakpoint
CREATE INDEX "embedded_wallet_access_wallet_id_idx" ON "embedded_wallet_access" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "embedded_wallet_access_user_id_idx" ON "embedded_wallet_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "embedded_wallet_access_passkey_id_idx" ON "embedded_wallet_access" USING btree ("passkey_id");--> statement-breakpoint
CREATE INDEX "embedded_wallet_access_credential_id_idx" ON "embedded_wallet_access" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "embedded_wallet_operation_wallet_id_idx" ON "embedded_wallet_operation" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "embedded_wallet_operation_user_id_idx" ON "embedded_wallet_operation" USING btree ("user_id");