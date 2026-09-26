// src/db/schema.ts

import {
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

/* ─────────────────────────────────────────────
   ENUMS
───────────────────────────────────────────── */

export const organizationRoleEnum = pgEnum("organization_role", [
  "admin",
  "collection_controller",
  "user",
]);

export const organizationMemberStatusEnum = pgEnum(
  "organization_member_status",
  ["active", "suspended", "invited"],
);

export const visibilityEnum = pgEnum("visibility", [
  "private",
  "organization",
  "shared",
]);

/* ─────────────────────────────────────────────
   USERS
───────────────────────────────────────────── */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    email: text("email").notNull(),

    passwordHash: text("password_hash").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
  ],
);

/* ─────────────────────────────────────────────
   ORGANIZATIONS
───────────────────────────────────────────── */

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    slug: text("slug").notNull(),

    description: text("description"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("organizations_slug_idx").on(table.slug),
    index("organizations_created_by_idx").on(table.createdBy),
  ],
);

/* ─────────────────────────────────────────────
   ORGANIZATION MEMBERS
───────────────────────────────────────────── */

export const organizationMembers = pgTable(
  "organization_members",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    role: organizationRoleEnum("role").notNull(),

    status: organizationMemberStatusEnum("status")
      .default("active")
      .notNull(),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.userId],
    }),

    index("organization_members_user_idx").on(table.userId),

    index("organization_members_org_role_idx").on(
      table.organizationId,
      table.role,
    ),
  ],
);

/* ─────────────────────────────────────────────
   COLLECTIONS
───────────────────────────────────────────── */

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    name: text("name").notNull(),

    description: text("description"),

    visibility: visibilityEnum("visibility")
      .default("private")
      .notNull(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collections_organization_idx").on(table.organizationId),
    index("collections_created_by_idx").on(table.createdBy),
  ],
);

/* ─────────────────────────────────────────────
   COLLECTION CONTROLLERS
───────────────────────────────────────────── */

export const collectionControllers = pgTable(
  "collection_controllers",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.collectionId, table.userId],
    }),

    index("collection_controllers_user_idx").on(table.userId),
  ],
);

/* ─────────────────────────────────────────────
   PLAYLISTS
───────────────────────────────────────────── */

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
      }),

    title: text("title").notNull(),

    description: text("description"),

    position: integer("position").default(0).notNull(),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("playlists_collection_idx").on(table.collectionId),
  ],
);

/* ─────────────────────────────────────────────
   VIDEOS
───────────────────────────────────────────── */

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    youtubeId: text("youtube_id").notNull(),

    youtubeUrl: text("youtube_url").notNull(),

    title: text("title"),

    description: text("description"),

    thumbnailUrl: text("thumbnail_url"),

    durationSeconds: integer("duration_seconds"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, {
        onDelete: "restrict",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("videos_youtube_id_idx").on(table.youtubeId),

    index("videos_created_by_idx").on(table.createdBy),
  ],
);

/* ─────────────────────────────────────────────
   PLAYLIST VIDEOS
   Many-to-many
───────────────────────────────────────────── */

export const playlistVideos = pgTable(
  "playlist_videos",
  {
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, {
        onDelete: "cascade",
      }),

    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, {
        onDelete: "cascade",
      }),

    position: integer("position").default(0).notNull(),

    addedAt: timestamp("added_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.playlistId, table.videoId],
    }),

    index("playlist_videos_video_idx").on(table.videoId),

    index("playlist_videos_position_idx").on(
      table.playlistId,
      table.position,
    ),
  ],
);

/* ─────────────────────────────────────────────
   COLLECTION SHARING
───────────────────────────────────────────── */

export const collectionShares = pgTable(
  "collection_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
      }),

    sharedWithOrganizationId: uuid("shared_with_organization_id")
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    sharedWithUserId: uuid("shared_with_user_id").references(
      () => users.id,
      {
        onDelete: "cascade",
      },
    ),

    shareToken: text("share_token").notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("collection_shares_token_idx").on(
      table.shareToken,
    ),

    index("collection_shares_collection_idx").on(
      table.collectionId,
    ),

    index("collection_shares_org_idx").on(
      table.sharedWithOrganizationId,
    ),

    index("collection_shares_user_idx").on(
      table.sharedWithUserId,
    ),
  ],
);

/* ─────────────────────────────────────────────
   USER VIDEO PROGRESS
───────────────────────────────────────────── */

export const videoProgress = pgTable(
  "video_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, {
        onDelete: "cascade",
      }),

    watchedSeconds: integer("watched_seconds")
      .default(0)
      .notNull(),

    completed: boolean("completed")
      .default(false)
      .notNull(),

    lastWatchedAt: timestamp("last_watched_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.videoId],
    }),

    index("video_progress_video_idx").on(table.videoId),
  ],
);

/* ─────────────────────────────────────────────
   RELATIONS
───────────────────────────────────────────── */

export const usersRelations = relations(users, ({ many }) => ({
  organizations: many(organizationMembers),
  createdOrganizations: many(organizations),
  createdCollections: many(collections),
  createdPlaylists: many(playlists),
  createdVideos: many(videos),
  collectionControllers: many(collectionControllers),
  videoProgress: many(videoProgress),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [organizations.createdBy],
      references: [users.id],
    }),

    members: many(organizationMembers),

    collections: many(collections),

    sharedCollections: many(collectionShares),
  }),
);

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),

    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  }),
);

export const collectionsRelations = relations(
  collections,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [collections.organizationId],
      references: [organizations.id],
    }),

    creator: one(users, {
      fields: [collections.createdBy],
      references: [users.id],
    }),

    controllers: many(collectionControllers),

    playlists: many(playlists),

    shares: many(collectionShares),
  }),
);

export const collectionControllersRelations = relations(
  collectionControllers,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionControllers.collectionId],
      references: [collections.id],
    }),

    user: one(users, {
      fields: [collectionControllers.userId],
      references: [users.id],
    }),
  }),
);

export const playlistsRelations = relations(
  playlists,
  ({ one, many }) => ({
    collection: one(collections, {
      fields: [playlists.collectionId],
      references: [collections.id],
    }),

    creator: one(users, {
      fields: [playlists.createdBy],
      references: [users.id],
    }),

    videos: many(playlistVideos),
  }),
);

export const videosRelations = relations(
  videos,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [videos.createdBy],
      references: [users.id],
    }),

    playlists: many(playlistVideos),

    progress: many(videoProgress),
  }),
);

export const playlistVideosRelations = relations(
  playlistVideos,
  ({ one }) => ({
    playlist: one(playlists, {
      fields: [playlistVideos.playlistId],
      references: [playlists.id],
    }),

    video: one(videos, {
      fields: [playlistVideos.videoId],
      references: [videos.id],
    }),
  }),
);

export const collectionSharesRelations = relations(
  collectionShares,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionShares.collectionId],
      references: [collections.id],
    }),

    organization: one(organizations, {
      fields: [collectionShares.sharedWithOrganizationId],
      references: [organizations.id],
    }),

    user: one(users, {
      fields: [collectionShares.sharedWithUserId],
      references: [users.id],
    }),
  }),
);

export const videoProgressRelations = relations(
  videoProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [videoProgress.userId],
      references: [users.id],
    }),

    video: one(videos, {
      fields: [videoProgress.videoId],
      references: [videos.id],
    }),
  }),
);
