import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { db } from "../db";
import {
  videos,
  playlists,
  playlistVideos,
  collections,
  organizationMembers,
} from "../db/schema";
import { auth } from "../middlewares/auth";

const videosRoute = new Hono();

videosRoute.use("*", auth);

/* Add video to a playlist */
videosRoute.post("/", async (c) => {
  const user = c.get("user");

  const {
    playlistId,
    youtubeUrl,
    title,
    description,
    thumbnailUrl,
    durationSeconds,
    position,
  } = await c.req.json();
  const youtubeId="dQw4w9WgXcQ";

  if (!playlistId || !youtubeId || !youtubeUrl) {
    return c.json(
      {
        error:
          "Playlist ID, YouTube ID and YouTube URL are required",
      },
      400,
    );
  }

  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
    with: {
      collection: true,
    },
  });

  if (!playlist) {
    return c.json({ error: "Playlist not found" }, 404);
  }

  const membership =
    await db.query.organizationMembers.findFirst({
      where: and(
        eq(
          organizationMembers.organizationId,
          playlist.collection.organizationId,
        ),
        eq(organizationMembers.userId, user.id),
      ),
    });

  if (
    !membership ||
    !["admin", "collection_controller"].includes(
      membership.role,
    )
  ) {
    return c.json({ error: "Permission denied" }, 403);
  }

  const video = await db.transaction(async (tx) => {
    let existing = await tx.query.videos.findFirst({
      where: eq(videos.youtubeId, youtubeId),
    });

    if (!existing) {
      const [created] = await tx
        .insert(videos)
        .values({
          youtubeId,
          youtubeUrl,
          title,
          description,
          thumbnailUrl,
          durationSeconds,
          createdBy: user.id,
        })
        .returning();

      existing = created;
    }

    await tx
      .insert(playlistVideos)
      .values({
        playlistId,
        videoId: existing.id,
        position: position ?? 0,
      })
      .onConflictDoNothing();

    return existing;
  });

  return c.json(video, 201);
});

/* Get video */
videosRoute.get("/:id", async (c) => {
  const videoId = c.req.param("id");

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, videoId),
    with: {
      playlists: {
        with: {
          playlist: {
            with: {
              collection: true,
            },
          },
        },
      },
    },
  });

  if (!video) {
    return c.json({ error: "Video not found" }, 404);
  }

  const user = c.get("user");

  const accessible = video.playlists.some(
    ({ playlist }) => playlist.collection.organizationId,
  );

  if (!accessible) {
    return c.json({ error: "Access denied" }, 403);
  }

  return c.json(video);
});

/* Remove video from playlist */
videosRoute.delete(
  "/:videoId/playlist/:playlistId",
  async (c) => {
    const user = c.get("user");

    const videoId = c.req.param("videoId");
    const playlistId = c.req.param("playlistId");

    const playlist = await db.query.playlists.findFirst({
      where: eq(playlists.id, playlistId),
      with: {
        collection: true,
      },
    });

    if (!playlist) {
      return c.json({ error: "Playlist not found" }, 404);
    }

    const membership =
      await db.query.organizationMembers.findFirst({
        where: and(
          eq(
            organizationMembers.organizationId,
            playlist.collection.organizationId,
          ),
          eq(organizationMembers.userId, user.id),
        ),
      });

    if (
      !membership ||
      !["admin", "collection_controller"].includes(
        membership.role,
      )
    ) {
      return c.json({ error: "Permission denied" }, 403);
    }

    await db
      .delete(playlistVideos)
      .where(
        and(
          eq(playlistVideos.videoId, videoId),
          eq(playlistVideos.playlistId, playlistId),
        ),
      );

    return c.json({
      message: "Video removed from playlist",
    });
  },
);

export default videosRoute;
