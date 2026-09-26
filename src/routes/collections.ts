import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { db } from "../db";
import {
  collections,
  organizationMembers,
} from "../db/schema";
import { auth } from "../middlewares/auth";

const collectionsRoute = new Hono();

collectionsRoute.use("*", auth);

/* Create collection */
collectionsRoute.post("/", async (c) => {
  const user = c.get("user");

  const {
    organizationId,
    name,
    description,
    visibility,
  } = await c.req.json();

  if (!organizationId || !name) {
    return c.json(
      { error: "Organization ID and name are required" },
      400,
    );
  }

  const membership =
    await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
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

  const [collection] = await db
    .insert(collections)
    .values({
      organizationId,
      name,
      description,
      visibility: visibility ?? "private",
      createdBy: user.id,
    })
    .returning();

  return c.json(collection, 201);
});

/* Get organization's collections */
collectionsRoute.get(
  "/organization/:organizationId",
  async (c) => {
    const user = c.get("user");
    const organizationId = c.req.param("organizationId");

    const membership =
      await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, user.id),
        ),
      });

    if (!membership) {
      return c.json({ error: "Access denied" }, 403);
    }

    const result = await db.query.collections.findMany({
      where: eq(
        collections.organizationId,
        organizationId,
      ),
      with: {
        playlists: true,
      },
    });

    return c.json(result);
  },
);

/* Get collection */
collectionsRoute.get("/:id", async (c) => {
  const user = c.get("user");
  const collectionId = c.req.param("id");

  const collection =
    await db.query.collections.findFirst({
      where: eq(collections.id, collectionId),
      with: {
        organization: true,
        playlists: true,
      },
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

  if (!membership) {
    return c.json({ error: "Access denied" }, 403);
  }

  return c.json(collection);
});

export default collectionsRoute;
