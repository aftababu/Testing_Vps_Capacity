CREATE TYPE "public"."organization_member_status" AS ENUM('active', 'suspended', 'invited');--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('admin', 'collection_controller', 'user');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'organization', 'shared');--> statement-breakpoint
CREATE TABLE "collection_controllers" (
	"collection_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_controllers_collection_id_user_id_pk" PRIMARY KEY("collection_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "collection_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"shared_with_organization_id" uuid,
	"shared_with_user_id" uuid,
	"share_token" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "organization_role" NOT NULL,
	"status" "organization_member_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_organization_id_user_id_pk" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_videos" (
	"playlist_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "playlist_videos_playlist_id_video_id_pk" PRIMARY KEY("playlist_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_progress" (
	"user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"watched_seconds" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"last_watched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_progress_user_id_video_id_pk" PRIMARY KEY("user_id","video_id")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_id" text NOT NULL,
	"youtube_url" text NOT NULL,
	"title" text,
	"description" text,
	"thumbnail_url" text,
	"duration_seconds" integer,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collection_controllers" ADD CONSTRAINT "collection_controllers_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_controllers" ADD CONSTRAINT "collection_controllers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_shares" ADD CONSTRAINT "collection_shares_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_shares" ADD CONSTRAINT "collection_shares_shared_with_organization_id_organizations_id_fk" FOREIGN KEY ("shared_with_organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_shares" ADD CONSTRAINT "collection_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_videos" ADD CONSTRAINT "playlist_videos_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_videos" ADD CONSTRAINT "playlist_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_controllers_user_idx" ON "collection_controllers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_shares_token_idx" ON "collection_shares" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "collection_shares_collection_idx" ON "collection_shares" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collection_shares_org_idx" ON "collection_shares" USING btree ("shared_with_organization_id");--> statement-breakpoint
CREATE INDEX "collection_shares_user_idx" ON "collection_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "collections_organization_idx" ON "collections" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "collections_created_by_idx" ON "collections" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "organization_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_members_org_role_idx" ON "organization_members" USING btree ("organization_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_created_by_idx" ON "organizations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "playlist_videos_video_idx" ON "playlist_videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "playlist_videos_position_idx" ON "playlist_videos" USING btree ("playlist_id","position");--> statement-breakpoint
CREATE INDEX "playlists_collection_idx" ON "playlists" USING btree ("collection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "video_progress_video_idx" ON "video_progress" USING btree ("video_id");--> statement-breakpoint
CREATE UNIQUE INDEX "videos_youtube_id_idx" ON "videos" USING btree ("youtube_id");--> statement-breakpoint
CREATE INDEX "videos_created_by_idx" ON "videos" USING btree ("created_by");