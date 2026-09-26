import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { db } from "../db";
import {
  playlists,
  collections,
  organizationMembers,
} from "../db/schema";
import { auth } from "../middlewares/auth";

const playlistsRoute = new Hono();

playlistsRoute.use("*", auth);

playlistsRoute.post("/", async (c) => {
  const user = c.get("user");

  const {
    collectionId,
    title,
    description,
  } = await c.req.json();

  if (!collectionId || !title) {
    return c.json(
      { error: "Collection ID and title are required" },
      400,
    );
  }

  const collection = await db.query.collections.findFirst({
    where: eq(collections.id, collectionId),
  });

  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
  }

  const membership =
    await db.query.organizationMembers.findFirst({
      where: and(
        eq(
          organizationMembers.organizationId,
          collection.organizationId,
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

  const [playlist] = await db
    .insert(playlists)
    .values({
      collectionId,
      title,
      description,
      createdBy: user.id,
    })
    .returning();

  return c.json(playlist, 201);
});

playlistsRoute.get("/:id", async (c) => {
  const user = c.get("user");
  const playlistId = c.req.param("id");

  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistId),
    with: {
      collection: true,
      videos: {
        with: {
          video: true,
        },
      },
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

  if (!membership) {
    return c.json({ error: "Access denied" }, 403);
  }

  return c.json(playlist);
});

playlistsRoute.delete("/:id", async (c) => {
  const user = c.get("user");
  const playlistId = c.req.param("id");

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
    .delete(playlists)
    .where(eq(playlists.id, playlistId));

  return c.json({ message: "Playlist deleted" });
});

export default playlistsRoute;
