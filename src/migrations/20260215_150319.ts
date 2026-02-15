import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_maptiles_color" AS ENUM('yellow', 'red', 'white');
  CREATE TYPE "public"."enum_hex_images_transform_status" AS ENUM('pending', 'success', 'failed');
  CREATE TYPE "public"."enum_media_transform_status" AS ENUM('none', 'success', 'failed');
  CREATE TABLE "logs_players" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"player" varchar
  );
  
  CREATE TABLE "logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"author_id" integer,
  	"gms" varchar,
  	"when" timestamp(3) with time zone,
  	"content" jsonb,
  	"content_html" varchar,
  	"coordinates_row" numeric,
  	"coordinates_column" numeric,
  	"sort" numeric,
  	"pinned" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "database_related" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"to_id" integer,
  	"alias" varchar
  );
  
  CREATE TABLE "database_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag_id" integer
  );
  
  CREATE TABLE "database" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"author_id" integer,
  	"content" jsonb,
  	"content_html" varchar,
  	"coordinates_row" numeric,
  	"coordinates_column" numeric,
  	"sort" numeric,
  	"pinned" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "characters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"player_s" varchar,
  	"part_of_crew" boolean,
  	"image_id" integer,
  	"biography" jsonb,
  	"biography_html" varchar,
  	"sort" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "maptiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"info" varchar NOT NULL,
  	"author_id" integer,
  	"coordinates_row" numeric,
  	"coordinates_column" numeric,
  	"visible" boolean,
  	"image_id" integer,
  	"icons" varchar,
  	"color" "enum_maptiles_color",
  	"description" jsonb,
  	"description_html" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hex_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"media_id" integer NOT NULL,
  	"transform_status" "enum_hex_images_transform_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"short" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"is_hex_image" boolean DEFAULT false,
  	"hex_filename" varchar,
  	"transform_status" "enum_media_transform_status" DEFAULT 'none',
  	"transform_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"logs_id" integer,
  	"database_id" integer,
  	"characters_id" integer,
  	"maptiles_id" integer,
  	"hex_images_id" integer,
  	"tags_id" integer,
  	"users_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "logs_players" ADD CONSTRAINT "logs_players_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "logs" ADD CONSTRAINT "logs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "database_related" ADD CONSTRAINT "database_related_to_id_database_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."database"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "database_related" ADD CONSTRAINT "database_related_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."database"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "database_tags" ADD CONSTRAINT "database_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "database_tags" ADD CONSTRAINT "database_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."database"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "database" ADD CONSTRAINT "database_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "characters" ADD CONSTRAINT "characters_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "maptiles" ADD CONSTRAINT "maptiles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "maptiles" ADD CONSTRAINT "maptiles_image_id_hex_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."hex_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hex_images" ADD CONSTRAINT "hex_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_logs_fk" FOREIGN KEY ("logs_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_database_fk" FOREIGN KEY ("database_id") REFERENCES "public"."database"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_characters_fk" FOREIGN KEY ("characters_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_maptiles_fk" FOREIGN KEY ("maptiles_id") REFERENCES "public"."maptiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hex_images_fk" FOREIGN KEY ("hex_images_id") REFERENCES "public"."hex_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "logs_players_order_idx" ON "logs_players" USING btree ("_order");
  CREATE INDEX "logs_players_parent_id_idx" ON "logs_players" USING btree ("_parent_id");
  CREATE INDEX "logs_author_idx" ON "logs" USING btree ("author_id");
  CREATE INDEX "logs_updated_at_idx" ON "logs" USING btree ("updated_at");
  CREATE INDEX "logs_created_at_idx" ON "logs" USING btree ("created_at");
  CREATE INDEX "database_related_order_idx" ON "database_related" USING btree ("_order");
  CREATE INDEX "database_related_parent_id_idx" ON "database_related" USING btree ("_parent_id");
  CREATE INDEX "database_related_to_idx" ON "database_related" USING btree ("to_id");
  CREATE INDEX "database_tags_order_idx" ON "database_tags" USING btree ("_order");
  CREATE INDEX "database_tags_parent_id_idx" ON "database_tags" USING btree ("_parent_id");
  CREATE INDEX "database_tags_tag_idx" ON "database_tags" USING btree ("tag_id");
  CREATE INDEX "database_author_idx" ON "database" USING btree ("author_id");
  CREATE INDEX "database_updated_at_idx" ON "database" USING btree ("updated_at");
  CREATE INDEX "database_created_at_idx" ON "database" USING btree ("created_at");
  CREATE INDEX "characters_image_idx" ON "characters" USING btree ("image_id");
  CREATE INDEX "characters_updated_at_idx" ON "characters" USING btree ("updated_at");
  CREATE INDEX "characters_created_at_idx" ON "characters" USING btree ("created_at");
  CREATE INDEX "maptiles_author_idx" ON "maptiles" USING btree ("author_id");
  CREATE INDEX "maptiles_image_idx" ON "maptiles" USING btree ("image_id");
  CREATE INDEX "maptiles_updated_at_idx" ON "maptiles" USING btree ("updated_at");
  CREATE INDEX "maptiles_created_at_idx" ON "maptiles" USING btree ("created_at");
  CREATE INDEX "hex_images_media_idx" ON "hex_images" USING btree ("media_id");
  CREATE INDEX "hex_images_updated_at_idx" ON "hex_images" USING btree ("updated_at");
  CREATE INDEX "hex_images_created_at_idx" ON "hex_images" USING btree ("created_at");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("logs_id");
  CREATE INDEX "payload_locked_documents_rels_database_id_idx" ON "payload_locked_documents_rels" USING btree ("database_id");
  CREATE INDEX "payload_locked_documents_rels_characters_id_idx" ON "payload_locked_documents_rels" USING btree ("characters_id");
  CREATE INDEX "payload_locked_documents_rels_maptiles_id_idx" ON "payload_locked_documents_rels" USING btree ("maptiles_id");
  CREATE INDEX "payload_locked_documents_rels_hex_images_id_idx" ON "payload_locked_documents_rels" USING btree ("hex_images_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "logs_players" CASCADE;
  DROP TABLE "logs" CASCADE;
  DROP TABLE "database_related" CASCADE;
  DROP TABLE "database_tags" CASCADE;
  DROP TABLE "database" CASCADE;
  DROP TABLE "characters" CASCADE;
  DROP TABLE "maptiles" CASCADE;
  DROP TABLE "hex_images" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_maptiles_color";
  DROP TYPE "public"."enum_hex_images_transform_status";
  DROP TYPE "public"."enum_media_transform_status";`)
}
