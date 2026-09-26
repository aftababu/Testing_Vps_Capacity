import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { db } from "../db";
import {
  organizations,
  organizationMembers,
} from "../db/schema";
import { auth } from "../middlewares/auth";

const organizationsRoute = new Hono();

organizationsRoute.use("*", auth);

/* Create organization */
organizationsRoute.post("/", async (c) => {
  const user = c.get("user");
  const { name, slug, description } = await c.req.json();

  if (!name || !slug) {
    return c.json(
      { error: "Name and slug are required" },
      400,
    );
  }

  const organization = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({
        name,
        slug,
        description,
        createdBy: user.id,
      })
      .returning();

    await tx.insert(organizationMembers).values({
      organizationId: org.id,
      userId: user.id,
      role: "admin",
    });

    return org;
  });

  return c.json(organization, 201);
});

/* Get user's organizations */
organizationsRoute.get("/", async (c) => {
  const user = c.get("user");

  const result = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, user.id),
    with: {
      organization: true,
    },
  });

  return c.json(result);
});

/* Get organization */
organizationsRoute.get("/:id", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.param("id");

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

  const organization =
    await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

  if (!organization) {
    return c.json({ error: "Organization not found" }, 404);
  }

  return c.json(organization);
});

/* Add member */
organizationsRoute.post("/:id/members", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.param("id");

  const { userId, role } = await c.req.json();

  const membership =
    await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, user.id),
      ),
    });

  if (!membership || membership.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  const [member] = await db
    .insert(organizationMembers)
    .values({
      organizationId,
      userId,
      role: role ?? "user",
    })
    .returning();

  return c.json(member, 201);
});

export default organizationsRoute;
